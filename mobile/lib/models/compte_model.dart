class CompteModel {
  int? localId;
  int? serverId;
  String nom;
  String type;
  DateTime updatedAt;
  DateTime? deletedAt;
  int syncStatus; // 0: Pending Create, 1: Synced, 2: Pending Update

  CompteModel({
    this.localId,
    this.serverId,
    required this.nom,
    required this.type,
    required this.updatedAt,
    this.deletedAt,
    this.syncStatus = 1,
  });

  factory CompteModel.fromJson(Map<String, dynamic> json) {
    return CompteModel(
      serverId: json['id'],
      nom: json['nom'],
      type: json['type'],
      updatedAt: DateTime.parse(json['updatedAt']),
      deletedAt: json['deletedAt'] != null ? DateTime.parse(json['deletedAt']) : null,
      syncStatus: 1,
    );
  }

  factory CompteModel.fromDbMap(Map<String, dynamic> map) {
    return CompteModel(
      localId: map['localId'],
      serverId: map['serverId'],
      nom: map['nom'],
      type: map['type'],
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
      'type': type,
      'updatedAt': updatedAt.toIso8601String(),
      if (deletedAt != null) 'deletedAt': deletedAt!.toIso8601String(),
      'syncStatus': syncStatus,
    };
  }
}
