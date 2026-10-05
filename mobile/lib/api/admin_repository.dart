import 'package:united_tigers/api/api_client.dart';
import 'package:united_tigers/format.dart';
import 'package:united_tigers/models/admin_models.dart';

class AdminRepository {
  AdminRepository(this.client);

  final ApiClient client;

  static const collections = [
    'players',
    'staff',
    'matches',
    'news',
    'updates',
    'contacts',
    'gallery',
    'sponsors',
    'records',
    'products',
    'polls',
    'contests',
    'orders',
    'settings',
    'audit',
  ];

  Future<AdminSession> signIn(String email, String password) async {
    final data = asMap(await client.postData('/api/v1/auth/login', {'email': email, 'password': password}));
    final token = data['token']?.toString() ?? '';
    if (token.isEmpty) throw Exception('Sign-in did not return a session');
    await client.saveToken(token);
    return AdminSession.fromJson(data);
  }

  Future<AdminSession> me() async => AdminSession.fromJson(asMap(await client.get('/api/v1/auth/me')));

  Future<void> signOut() async {
    try {
      await client.post('/api/v1/auth/logout', {});
    } catch (_) {}
    await client.clearToken();
  }

  Future<DashboardSummary> dashboard() async => DashboardSummary.fromJson(asMap(await client.get('/api/v1/admin/dashboard')));

  Future<List<AdminRole>> roles() async => AdminRole.list(await client.get('/api/v1/admin/roles'));

  Future<List<AdminAccount>> users() async => AdminAccount.list(await client.get('/api/v1/admin/users'));

  Future<AdminAccount> user(String id) async => AdminAccount.fromJson(asMap(await client.get('/api/v1/admin/users/$id')));

  Future<AdminAccount> createUser(Map<String, dynamic> payload) async => AdminAccount.fromJson(asMap(await client.postData('/api/v1/admin/users', payload)));

  Future<AdminAccount> updateUser(String id, Map<String, dynamic> payload) async => AdminAccount.fromJson(asMap(await client.patch('/api/v1/admin/users/$id', payload)));

  Future<void> deleteUser(String id) async {
    await client.delete('/api/v1/admin/users/$id');
  }

  Future<List<AdminRecord>> collection(String name) async => AdminRecord.list(await client.get('/api/v1/admin/$name'));

  Future<AdminRecord> record(String name, String id) async => AdminRecord.fromJson(asMap(await client.get('/api/v1/admin/$name/$id')));

  Future<AdminRecord> createRecord(String name, Map<String, dynamic> payload) async => AdminRecord.fromJson(asMap(await client.postData('/api/v1/admin/$name', payload)));

  Future<AdminRecord> updateRecord(String name, String id, Map<String, dynamic> payload) async => AdminRecord.fromJson(asMap(await client.patch('/api/v1/admin/$name/$id', payload)));

  Future<void> deleteRecord(String name, String id) async {
    await client.delete('/api/v1/admin/$name/$id');
  }

  Future<ScorecardSheet> scorecard(String matchId) async => ScorecardSheet.fromJson(asMap(await client.get('/api/v1/admin/matches/$matchId/scorecard')));

  Future<void> saveScorecard(String matchId, Map<String, dynamic> payload) async {
    await client.put('/api/v1/admin/matches/$matchId/scorecard', payload);
  }

  Future<UploadedMedia> uploadMedia(List<int> bytes, String filename, String contentType) async {
    return UploadedMedia.fromJson(asMap(await client.upload('/api/v1/admin/media/upload', bytes, filename, contentType)));
  }
}
