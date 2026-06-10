

import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart';

class DbContext {
  static Database? _db;
  
  static Future<Database> get db async {
    if (_db == null) {
      _db = await _initDb();
    }
    return _db!;
  }

  static Future<Database> _initDb() async {
    String dbPath = await getDatabasesPath();
    String path = join(dbPath, 'dirhamy.db');
    return await openDatabase(
      path, 
      version: 2, 
      onCreate: _onCreate,
      onUpgrade: _onUpgrade,
    );
  }

  static Future<void> _onUpgrade(Database db, int oldVersion, int newVersion) async {
    if (oldVersion < 2) {
      await db.execute('ALTER TABLE categories ADD COLUMN icon TEXT');
    }
  }

  static Future<void> _onCreate(Database db, int version) async {
    Batch batch = db.batch();

    // Table UserCredentials
    batch.execute('''
      CREATE TABLE user_credentials(
        localId INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL
      )
    ''');

    // Table Comptes
    batch.execute('''
      CREATE TABLE comptes(
        localId INTEGER PRIMARY KEY AUTOINCREMENT,
        serverId INTEGER UNIQUE,
        nom TEXT NOT NULL,
        type TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        deletedAt TEXT,
        syncStatus INTEGER NOT NULL DEFAULT 0
      )
    ''');

    // Table Categories
    batch.execute('''
      CREATE TABLE categories(
        localId INTEGER PRIMARY KEY AUTOINCREMENT,
        serverId INTEGER UNIQUE,
        nom TEXT NOT NULL,
        budgetLimit REAL,
        icon TEXT,
        updatedAt TEXT NOT NULL,
        deletedAt TEXT,
        syncStatus INTEGER NOT NULL DEFAULT 0
      )
    ''');
    // Table Transfers
    batch.execute('''
      CREATE TABLE transfers(
        localId INTEGER PRIMARY KEY AUTOINCREMENT,
        serverId INTEGER UNIQUE,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        deletedAt TEXT,
        syncStatus INTEGER NOT NULL DEFAULT 0
      )
    ''');

    // Table Transactions
    batch.execute('''
      CREATE TABLE transactions(
        localId INTEGER PRIMARY KEY AUTOINCREMENT,
        serverId INTEGER UNIQUE,
        amount REAL NOT NULL,
        type TEXT NOT NULL,
        date TEXT NOT NULL,
        description TEXT NOT NULL,
        compteId INTEGER,
        idDestination INTEGER,
        transferId INTEGER,
        categorieId INTEGER,
        updatedAt TEXT NOT NULL,
        deletedAt TEXT,
        syncStatus INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY(compteId) REFERENCES comptes(localId),
        FOREIGN KEY(idDestination) REFERENCES comptes(localId),
        FOREIGN KEY(transferId) REFERENCES transfers(localId),
        FOREIGN KEY(categorieId) REFERENCES categories(localId)
      )
    ''');

    // Table Conversations
    batch.execute('''
      CREATE TABLE conversations(
        localId INTEGER PRIMARY KEY AUTOINCREMENT,
        serverId INTEGER UNIQUE,
        title TEXT NOT NULL DEFAULT 'New Chat',
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        deletedAt TEXT,
        syncStatus INTEGER NOT NULL DEFAULT 0
      )
    ''');

    // Table ChatMessages
    batch.execute('''
      CREATE TABLE chat_messages(
        localId INTEGER PRIMARY KEY AUTOINCREMENT,
        serverId INTEGER UNIQUE,
        content TEXT NOT NULL,
        sender TEXT NOT NULL,
        conversationId INTEGER NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        deletedAt TEXT,
        syncStatus INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY(conversationId) REFERENCES conversations(localId) ON DELETE CASCADE
      )
    ''');

    await batch.commit();
  }
}