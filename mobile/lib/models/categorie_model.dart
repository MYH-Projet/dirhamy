class CategorieModel {
  int? localId;
  int? serverId;
  String nom;
  double? budgetLimit;
  DateTime updatedAt;
  DateTime? deletedAt;
  int syncStatus;

  CategorieModel({
    this.localId,
    this.serverId,
    required this.nom,
    this.budgetLimit,
    required this.updatedAt,
    this.deletedAt,
    this.syncStatus = 1,
  });

  factory CategorieModel.fromJson(Map<String, dynamic> json) {
    return CategorieModel(
      serverId: json['id'],
      nom: json['nom'],
      budgetLimit: json['budgetLimit'] != null ? (json['budgetLimit'] as num).toDouble() : null,
      updatedAt: DateTime.parse(json['updatedAt']),
      deletedAt: json['deletedAt'] != null ? DateTime.parse(json['deletedAt']) : null,
      syncStatus: 1,
    );
  }

  factory CategorieModel.fromDbMap(Map<String, dynamic> map) {
    return CategorieModel(
      localId: map['localId'],
      serverId: map['serverId'],
      nom: map['nom'],
      budgetLimit: map['budgetLimit'] != null ? (map['budgetLimit'] as num).toDouble() : null,
      updatedAt: DateTime.parse(map['updatedAt']),
      deletedAt: map['deletedAt'] != null ? DateTime.parse(map['deletedAt']) : null,
      syncStatus: map['syncStatus'] ?? 1,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      if (localId != null) 'localId': localId,
      if (serverId != null) 'serverId': serverId,
      'nom': nom,
      'budgetLimit': budgetLimit,
      'updatedAt': updatedAt.toIso8601String(),
      if (deletedAt != null) 'deletedAt': deletedAt!.toIso8601String(),
      'syncStatus': syncStatus,
    };
  }
}
