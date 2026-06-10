import 'categorie_model.dart';

class TransactionModel {
  int? localId;
  int? serverId;
  double amount;
  String type;
  DateTime date;
  String description;
  DateTime updatedAt;
  DateTime? deletedAt;
  int syncStatus; // 0: Pending Create, 1: Synced, 2: Pending Update
  int? compteId;
  int? idDestination;
  int? transferId;
  int? categorieId;

  TransactionModel({
    this.localId,
    this.serverId,
    required this.amount,
    required this.type,
    required this.date,
    required this.description,
    required this.updatedAt,
    this.deletedAt,
    this.syncStatus = 1,
    this.compteId,
    this.idDestination,
    this.transferId,
    this.categorieId,
  });

  factory TransactionModel.fromJson(Map<String, dynamic> json) {
    return TransactionModel(
      serverId: json['id'],
      amount: (json['montant'] as num).toDouble(),
      type: json['type'],
      date: DateTime.parse(json['date']),
      description: json['description'],
      updatedAt: DateTime.parse(json['updatedAt']),
      deletedAt: json['deletedAt'] != null ? DateTime.parse(json['deletedAt']) : null,
      syncStatus: 1,
      compteId: json['compteId'],
      idDestination: json['idDestination'],
      transferId: json['transferId'],
      categorieId: json['categorieId'],
    );
  }

  factory TransactionModel.fromDbMap(Map<String, dynamic> map) {
    return TransactionModel(
      localId: map['localId'],
      serverId: map['serverId'],
      amount: (map['amount'] as num).toDouble(),
      type: map['type'],
      date: DateTime.parse(map['date']),
      description: map['description'],
      updatedAt: DateTime.parse(map['updatedAt']),
      deletedAt: map['deletedAt'] != null ? DateTime.parse(map['deletedAt']) : null,
      syncStatus: map['syncStatus'] ?? 1,
      compteId: map['compteId'],
      idDestination: map['idDestination'],
      transferId: map['transferId'],
      categorieId: map['categorieId'],
    );
  }

  Map<String, dynamic> toMap() {
    return {
      if (localId != null) 'localId': localId,
      if (serverId != null) 'serverId': serverId,
      'amount': amount,
      'type': type,
      'date': date.toIso8601String(),
      'description': description,
      'updatedAt': updatedAt.toIso8601String(),
      if (deletedAt != null) 'deletedAt': deletedAt!.toIso8601String(),
      'syncStatus': syncStatus,
      if (compteId != null) 'compteId': compteId,
      if (idDestination != null) 'idDestination': idDestination,
      if (transferId != null) 'transferId': transferId,
      if (categorieId != null) 'categorieId': categorieId,
    };
  }
}

class TransactionWithCategory {
  final TransactionModel transaction;
  final CategorieModel? category;

  TransactionWithCategory({
    required this.transaction,
    this.category,
  });
}
