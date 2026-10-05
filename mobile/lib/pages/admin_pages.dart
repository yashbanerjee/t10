import 'package:flutter/material.dart';
import 'package:united_tigers/api/admin_repository.dart';
import 'package:united_tigers/format.dart';
import 'package:united_tigers/models/admin_models.dart';
import 'package:united_tigers/scope.dart';
import 'package:united_tigers/widgets.dart';

class AdminHomePage extends StatelessWidget {
  const AdminHomePage({super.key});

  @override
  Widget build(BuildContext context) {
    final api = ClubScope.of(context).api;
    return AnimatedBuilder(
      animation: api,
      builder: (context, _) {
        if (api.adminSession == null) return const AdminLoginPage();
        return const AdminDeskPage();
      },
    );
  }
}

class AdminLoginPage extends StatefulWidget {
  const AdminLoginPage({super.key});

  @override
  State<AdminLoginPage> createState() => _AdminLoginPageState();
}

class _AdminLoginPageState extends State<AdminLoginPage> {
  final email = TextEditingController();
  final password = TextEditingController();
  bool busy = false;

  @override
  void dispose() {
    email.dispose();
    password.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('ADMIN SIGN IN')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const Text('Use the same administrator account as the website. The app keeps the session token and sends it with every admin request.'),
          const SizedBox(height: 16),
          ClubField(label: 'Email', controller: email, email: true),
          ClubField(label: 'Password', controller: password, secret: true),
          FilledButton(onPressed: busy ? null : _submit, child: Text(busy ? 'SIGNING IN…' : 'SIGN IN')),
        ],
      ),
    );
  }

  Future<void> _submit() async {
    setState(() => busy = true);
    try {
      await ClubScope.of(context).api.signIn(email.text.trim(), password.text);
    } catch (reason) {
      if (mounted) await showClubMessage(context, '$reason'.replaceFirst('Exception: ', ''));
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }
}

class AdminDeskPage extends StatefulWidget {
  const AdminDeskPage({super.key});

  @override
  State<AdminDeskPage> createState() => _AdminDeskPageState();
}

class _AdminDeskPageState extends State<AdminDeskPage> {
  DashboardSummary? summary;
  String? error;
  bool started = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (started) return;
    started = true;
    _load();
  }

  Future<void> _load() async {
    try {
      final data = await ClubScope.of(context).api.admin.dashboard();
      if (mounted) setState(() => summary = data);
    } catch (reason) {
      if (mounted) setState(() => error = '$reason'.replaceFirst('Exception: ', ''));
    }
  }

  @override
  Widget build(BuildContext context) {
    final session = ClubScope.of(context).api.adminSession;
    final desk = summary;
    return Scaffold(
      appBar: AppBar(
        title: const Text('ADMIN'),
        actions: [
          IconButton(
            onPressed: () async {
              await ClubScope.of(context).api.signOut();
              if (context.mounted) Navigator.pop(context);
            },
            icon: const Icon(Icons.logout),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text(session?.name ?? '', style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w800)),
          Text('${session?.email ?? ''} · ${session?.roleLabel ?? ''}'),
          const SizedBox(height: 16),
          if (error != null) Text(error!),
          if (desk != null)
            ClubCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Players ${desk.players} · Matches ${desk.matches}'),
                  Text('News ${desk.news} · Updates ${desk.updates}'),
                  Text('Gallery ${desk.gallery} · Sponsors ${desk.sponsors}'),
                  Text('Unread messages ${desk.unreadMessages}'),
                  if (desk.upcoming != null) Text('Next · ${desk.upcoming}'),
                ],
              ),
            ),
          const SectionTitle('COLLECTIONS'),
          ...AdminRepository.collections.map(
            (name) => ListTile(
              title: Text(name.toUpperCase()),
              trailing: const Icon(Icons.chevron_right),
              onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => AdminCollectionPage(collection: name))),
            ),
          ),
          ListTile(title: const Text('USERS'), trailing: const Icon(Icons.chevron_right), onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const AdminUsersPage()))),
          ListTile(title: const Text('ROLES'), trailing: const Icon(Icons.chevron_right), onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const AdminRolesPage()))),
        ],
      ),
    );
  }
}

class AdminCollectionPage extends StatefulWidget {
  const AdminCollectionPage({super.key, required this.collection});
  final String collection;

  @override
  State<AdminCollectionPage> createState() => _AdminCollectionPageState();
}

class _AdminCollectionPageState extends State<AdminCollectionPage> {
  List<AdminRecord> rows = [];
  String? error;
  bool loading = true;
  bool started = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (started) return;
    started = true;
    _load();
  }

  Future<void> _load() async {
    setState(() { loading = true; error = null; });
    try {
      final data = await ClubScope.of(context).api.admin.collection(widget.collection);
      if (mounted) setState(() { rows = data; loading = false; });
    } catch (reason) {
      if (mounted) setState(() { error = '$reason'.replaceFirst('Exception: ', ''); loading = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(widget.collection.toUpperCase())),
      body: loading
          ? const LoadingView()
          : error != null
              ? MessageView(error!, onRetry: _load)
              : RefreshIndicator(
                  onRefresh: _load,
                  child: ListView.separated(
                    padding: const EdgeInsets.all(16),
                    itemCount: rows.length,
                    separatorBuilder: (_, _) => const SizedBox(height: 8),
                    itemBuilder: (context, index) {
                      final row = rows[index];
                      return ClubCard(
                        onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => AdminRecordPage(collection: widget.collection, id: row.id, preview: row))),
                        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                          Text(row.title, style: const TextStyle(fontWeight: FontWeight.w800)),
                          if (row.subtitle.isNotEmpty) Text(row.subtitle),
                        ]),
                      );
                    },
                  ),
                ),
    );
  }
}

class AdminRecordPage extends StatefulWidget {
  const AdminRecordPage({super.key, required this.collection, required this.id, this.preview});
  final String collection;
  final String id;
  final AdminRecord? preview;

  @override
  State<AdminRecordPage> createState() => _AdminRecordPageState();
}

class _AdminRecordPageState extends State<AdminRecordPage> {
  AdminRecord? record;
  bool started = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (started) return;
    started = true;
    record = widget.preview;
    if (widget.collection == 'audit' || widget.id.isEmpty) return;
    ClubScope.of(context).api.admin.record(widget.collection, widget.id).then((loaded) {
      if (mounted) setState(() => record = loaded);
    }).catchError((_) {});
  }

  @override
  Widget build(BuildContext context) {
    final current = record;
    if (current == null) return const Scaffold(body: LoadingView());
    return Scaffold(
      appBar: AppBar(title: Text(current.title)),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          ...current.fields.entries.map((field) => Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  SizedBox(width: 120, child: Text(field.key, style: const TextStyle(color: gold))),
                  Expanded(child: Text(field.value)),
                ]),
              )),
          if (widget.collection == 'matches' && widget.id.isNotEmpty)
            FilledButton(
              onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => AdminScorecardPage(matchId: widget.id))),
              child: const Text('SCORECARD'),
            ),
          if (widget.collection != 'audit' && widget.id.isNotEmpty) ...[
            const SizedBox(height: 8),
            OutlinedButton(onPressed: _delete, child: const Text('DELETE')),
          ],
        ],
      ),
    );
  }

  Future<void> _delete() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete this record?'),
        content: const Text('This removes it from the club database.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('CANCEL')),
          TextButton(onPressed: () => Navigator.pop(context, true), child: const Text('DELETE')),
        ],
      ),
    );
    if (confirmed != true || !mounted) return;
    try {
      await ClubScope.of(context).api.admin.deleteRecord(widget.collection, widget.id);
      if (mounted) Navigator.pop(context);
    } catch (reason) {
      if (mounted) await showClubMessage(context, '$reason'.replaceFirst('Exception: ', ''));
    }
  }
}

class AdminScorecardPage extends StatefulWidget {
  const AdminScorecardPage({super.key, required this.matchId});
  final String matchId;

  @override
  State<AdminScorecardPage> createState() => _AdminScorecardPageState();
}

class _AdminScorecardPageState extends State<AdminScorecardPage> {
  ScorecardSheet? sheet;
  String? error;
  bool started = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (started) return;
    started = true;
    ClubScope.of(context).api.admin.scorecard(widget.matchId).then((loaded) {
      if (mounted) setState(() => sheet = loaded);
    }).catchError((reason) {
      if (mounted) setState(() => error = '$reason'.replaceFirst('Exception: ', ''));
    });
  }

  @override
  Widget build(BuildContext context) {
    final current = sheet;
    return Scaffold(
      appBar: AppBar(title: const Text('SCORECARD')),
      body: error != null
          ? MessageView(error!)
          : current == null
              ? const LoadingView()
              : ListView(
                  padding: const EdgeInsets.all(16),
                  children: [
                    Text('vs ${current.opponent}', style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w800)),
                    Text(current.status),
                    const SizedBox(height: 12),
                    ...current.innings.map((line) => Padding(padding: const EdgeInsets.only(bottom: 8), child: Text(line))),
                    const SectionTitle('SQUAD AVAILABLE'),
                    ...current.players.map((player) => Text(player.title)),
                  ],
                ),
    );
  }
}

class AdminUsersPage extends StatefulWidget {
  const AdminUsersPage({super.key});

  @override
  State<AdminUsersPage> createState() => _AdminUsersPageState();
}

class _AdminUsersPageState extends State<AdminUsersPage> {
  List<AdminAccount> rows = [];
  String? error;
  bool loading = true;
  bool started = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (started) return;
    started = true;
    _load();
  }

  Future<void> _load() async {
    try {
      final data = await ClubScope.of(context).api.admin.users();
      if (mounted) setState(() { rows = data; loading = false; });
    } catch (reason) {
      if (mounted) setState(() { error = '$reason'.replaceFirst('Exception: ', ''); loading = false; });
    }
  }

  Future<void> _setActive(AdminAccount user, bool active) async {
    try {
      await ClubScope.of(context).api.admin.updateUser(user.id, {'isActive': active});
      await _load();
    } catch (reason) {
      if (mounted) await showClubMessage(context, '$reason'.replaceFirst('Exception: ', ''));
    }
  }

  Future<void> _delete(AdminAccount user) async {
    try {
      await ClubScope.of(context).api.admin.deleteUser(user.id);
      await _load();
    } catch (reason) {
      if (mounted) await showClubMessage(context, '$reason'.replaceFirst('Exception: ', ''));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('ADMIN USERS')),
      body: loading
          ? const LoadingView()
          : error != null
              ? MessageView(error!)
              : ListView(
                  padding: const EdgeInsets.all(16),
                  children: [
                    ...rows.map((user) => Padding(
                          padding: const EdgeInsets.only(bottom: 8),
                          child: ClubCard(
                            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                              Text(user.name, style: const TextStyle(fontWeight: FontWeight.w800)),
                              Text('${user.email} · ${user.role.replaceAll('_', ' ')}'),
                              Text(user.isActive ? 'Active' : 'Inactive'),
                              if (user.lastLoginAt != null) Text(when(user.lastLoginAt)),
                              Row(children: [
                                TextButton(onPressed: () => _setActive(user, !user.isActive), child: Text(user.isActive ? 'DEACTIVATE' : 'ACTIVATE')),
                                TextButton(onPressed: () => _delete(user), child: const Text('DELETE')),
                              ]),
                            ]),
                          ),
                        )),
                    FilledButton(onPressed: () async {
                      await Navigator.push(context, MaterialPageRoute(builder: (_) => const AdminUserFormPage()));
                      if (mounted) _load();
                    }, child: const Text('NEW ACCOUNT')),
                  ],
                ),
    );
  }
}

class AdminUserFormPage extends StatefulWidget {
  const AdminUserFormPage({super.key});

  @override
  State<AdminUserFormPage> createState() => _AdminUserFormPageState();
}

class _AdminUserFormPageState extends State<AdminUserFormPage> {
  final name = TextEditingController();
  final email = TextEditingController();
  final password = TextEditingController();
  String role = 'EDITOR';
  bool busy = false;

  @override
  void dispose() {
    name.dispose();
    email.dispose();
    password.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('NEW ACCOUNT')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          ClubField(label: 'Name', controller: name),
          ClubField(label: 'Email', controller: email, email: true),
          ClubField(label: 'Password', controller: password, secret: true),
          const Text('Password must be at least 12 characters.'),
          const SizedBox(height: 8),
          DropdownButtonFormField<String>(
            initialValue: role,
            items: const ['SUPER_ADMIN', 'ADMIN', 'EDITOR', 'STATISTICS_MANAGER', 'CONTENT_MANAGER']
                .map((item) => DropdownMenuItem(value: item, child: Text(item.replaceAll('_', ' '))))
                .toList(),
            onChanged: (value) => setState(() => role = value ?? role),
          ),
          const SizedBox(height: 16),
          FilledButton(onPressed: busy ? null : _submit, child: Text(busy ? 'SAVING…' : 'CREATE')),
        ],
      ),
    );
  }

  Future<void> _submit() async {
    setState(() => busy = true);
    try {
      await ClubScope.of(context).api.admin.createUser({
        'name': name.text.trim(),
        'email': email.text.trim(),
        'password': password.text,
        'role': role,
        'isActive': true,
      });
      if (mounted) Navigator.pop(context);
    } catch (reason) {
      if (mounted) await showClubMessage(context, '$reason'.replaceFirst('Exception: ', ''));
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }
}

class AdminRolesPage extends StatefulWidget {
  const AdminRolesPage({super.key});

  @override
  State<AdminRolesPage> createState() => _AdminRolesPageState();
}

class _AdminRolesPageState extends State<AdminRolesPage> {
  List<AdminRole> rows = [];
  String? error;
  bool started = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (started) return;
    started = true;
    ClubScope.of(context).api.admin.roles().then((data) {
      if (mounted) setState(() => rows = data);
    }).catchError((reason) {
      if (mounted) setState(() => error = '$reason'.replaceFirst('Exception: ', ''));
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('ROLES')),
      body: error != null
          ? MessageView(error!)
          : ListView(
              padding: const EdgeInsets.all(16),
              children: rows
                  .map((role) => Padding(
                        padding: const EdgeInsets.only(bottom: 8),
                        child: ClubCard(
                          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                            Text(role.name, style: const TextStyle(fontWeight: FontWeight.w800)),
                            Text(role.description),
                            Text(role.permissions.join(', ')),
                          ]),
                        ),
                      ))
                  .toList(),
            ),
    );
  }
}
