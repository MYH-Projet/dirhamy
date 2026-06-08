class TransferModel {
  int? localId;
  int? serverId;
  DateTime createdAt;
  DateTime updatedAt;
  DateTime? deletedAt;
  int syncStatus;

  TransferModel({
    this.localId,
    this.serverId,
    required this.createdAt,
    required this.updatedAt,
    this.deletedAt,
    this.syncStatus = 1,
  });

  factory TransferModel.fromJson(Map<String, dynamic> json) {
    return TransferModel(
      serverId: json['id'],
      createdAt: DateTime.parse(json['createdAt']),
      updatedAt: DateTime.parse(json['updatedAt']),
      deletedAt: json['deletedAt'] != null ? DateTime.parse(json['deletedAt']) : null,
      syncStatus: 1,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      if (localId != null) 'localId': localId,
      if (serverId != null) 'serverId': serverId,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
      if (deletedAt != null) 'deletedAt': deletedAt!.toIso8601String(),
      'syncStatus': syncStatus,
    };
  }
}
