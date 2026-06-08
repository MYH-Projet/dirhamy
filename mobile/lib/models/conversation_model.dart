class ConversationModel {
  int? localId;
  int? serverId;
  String title;
  DateTime createdAt;
  DateTime updatedAt;
  DateTime? deletedAt;
  int syncStatus;

  ConversationModel({
    this.localId,
    this.serverId,
    this.title = 'New Chat',
    required this.createdAt,
    required this.updatedAt,
    this.deletedAt,
    this.syncStatus = 1,
  });

  factory ConversationModel.fromJson(Map<String, dynamic> json) {
    return ConversationModel(
      serverId: json['id'],
      title: json['title'] ?? 'New Chat',
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
      'title': title,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
      if (deletedAt != null) 'deletedAt': deletedAt!.toIso8601String(),
      'syncStatus': syncStatus,
    };
  }
}
