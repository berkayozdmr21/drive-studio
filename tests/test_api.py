import os
import tempfile
import unittest
from pathlib import Path

TEST_DATA = tempfile.TemporaryDirectory(prefix='drive-tests-')
os.environ['DRIVE_DATA_DIR'] = TEST_DATA.name
from fastapi.testclient import TestClient
from backend.main import app, database

HEADERS = {'X-Studio-Client': 'drive-studio'}
CONFIG = dict(vehicle='458-study', color='copper', wheels='forged', interior='saddle', finish='gloss', package='studio')

class StudioTests(unittest.TestCase):
    def setUp(self):
        with database() as db:
            db.execute('DELETE FROM designs')
        self.client = TestClient(app)
        self.client.get('/api/session')

    def save(self, client=None):
        return (client or self.client).post('/api/designs', json={'title': 'Copper Study', 'configuration': CONFIG}, headers=HEADERS)

    def test_health(self):
        self.assertEqual(self.client.get('/api/health').json()['status'], 'ok')

    def test_ten_vehicle_prices(self):
        vehicles = self.client.get('/api/catalog').json()['vehicles']
        self.assertEqual(len(vehicles), 10)
        self.assertEqual(len({v['id'] for v in vehicles}), 10)
        for vehicle in vehicles:
            response = self.client.post('/api/quote', json={**CONFIG, 'vehicle': vehicle['id']}, headers=HEADERS)
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.json()['total'], vehicle['base_price'] + 5400)

    def test_saved_vehicle_survives_public_share(self):
        for vehicle in self.client.get('/api/catalog').json()['vehicles']:
            response = self.client.post('/api/designs', json={'title': vehicle['name'], 'configuration': {**CONFIG, 'vehicle': vehicle['id']}}, headers=HEADERS)
            self.assertEqual(response.status_code, 201)
            shared = TestClient(app).get('/api/designs/' + response.json()['id']).json()
            self.assertEqual(shared['configuration']['vehicle'], vehicle['id'])
            self.assertEqual(shared['quote']['total'], vehicle['base_price'] + 5400)

    def test_invalid_vehicle_rejected(self):
        self.assertEqual(self.client.post('/api/quote', json={**CONFIG, 'vehicle': 'fake'}, headers=HEADERS).status_code, 422)

    def test_legacy_configuration_defaults_to_ferrari(self):
        config = {k: v for k, v in CONFIG.items() if k != 'vehicle'}
        self.assertEqual(self.client.post('/api/quote', json=config, headers=HEADERS).json()['total'], 224400)

    def test_quote(self):
        result = self.client.post('/api/quote', json=CONFIG, headers=HEADERS).json()
        self.assertEqual(result['total'], 224400)
        self.assertTrue(result['demo'])

    def test_extra_price_rejected(self):
        self.assertEqual(self.client.post('/api/quote', json={**CONFIG, 'total': 1}, headers=HEADERS).status_code, 422)

    def test_invalid_option_rejected(self):
        self.assertEqual(self.client.post('/api/quote', json={**CONFIG, 'color': 'unknown'}, headers=HEADERS).status_code, 422)

    def test_session_cookie(self):
        client = TestClient(app)
        response = client.get('/api/session')
        self.assertIn('HttpOnly', response.headers['set-cookie'])
        self.assertIn('SameSite=lax', response.headers['set-cookie'])
        self.assertEqual(len(client.cookies['drive_studio_owner']), 64)

    def test_anonymous_write_needs_session(self):
        self.assertEqual(self.save(TestClient(app)).status_code, 401)

    def test_save_and_persistence(self):
        response = self.save()
        self.assertEqual(response.status_code, 201)
        with database() as db:
            self.assertEqual(db.execute('SELECT COUNT(*) FROM designs').fetchone()[0], 1)
        self.assertEqual(self.client.get('/api/designs').json()[0]['configuration'], CONFIG)

    def test_owner_isolation_and_public_read(self):
        design = self.save().json()
        stranger = TestClient(app)
        stranger.get('/api/session')
        self.assertEqual(stranger.get('/api/designs').json(), [])
        public = stranger.get('/api/designs/' + design['id']).json()
        self.assertNotIn('owner', public)
        self.assertEqual(public['title'], 'Copper Study')
        self.assertEqual(stranger.delete('/api/designs/' + design['id'], headers=HEADERS).status_code, 404)

    def test_delete_invalidates_public_link(self):
        key = self.save().json()['id']
        self.assertEqual(self.client.delete('/api/designs/' + key, headers=HEADERS).status_code, 204)
        self.assertEqual(self.client.get('/api/designs/' + key).status_code, 404)

    def test_cross_origin_write_blocked(self):
        response = self.client.post('/api/quote', json=CONFIG, headers={**HEADERS, 'Origin': 'https://evil.example'})
        self.assertEqual(response.status_code, 403)

    def test_client_header_required(self):
        self.assertEqual(self.client.post('/api/quote', json=CONFIG).status_code, 403)

    def test_blank_title(self):
        self.assertEqual(self.client.post('/api/designs', json={'title': '   ', 'configuration': CONFIG}, headers=HEADERS).status_code, 422)

    def test_design_limit(self):
        for _ in range(100):
            self.assertEqual(self.save().status_code, 201)
        self.assertEqual(self.save().status_code, 409)

    def test_packaged_assets(self):
        root = Path(__file__).absolute().parents[1] / 'frontend/dist'
        if not root.exists():
            self.skipTest('Build frontend first')
        self.assertEqual(self.client.get('/').status_code, 200)
        response = self.client.get('/models/ferrari.glb')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.content[:4], b'glTF')
        self.assertEqual(self.client.get('/draco/draco_decoder.wasm').content[:4], b'\x00asm')
