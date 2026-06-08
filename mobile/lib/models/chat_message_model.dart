class ChatMessageModel {
  int? localId;
  int? serverId;
  String content;
  String sender;
  int conversationId;
  DateTime createdAt;
  DateTime updatedAt;
  DateTime? deletedAt;
  int syncStatus;

  ChatMessageModel({
    this.localId,
    this.serverId,
    required this.content,
    required this.sender,
    required this.conversationId,
    required this.createdAt,
    required this.updatedAt,
    this.deletedAt,
    this.syncStatus = 1,
  });

  factory ChatMessageModel.fromJson(Map<String, dynamic> json) {
    return ChatMessageModel(
      serverId: json['id'],
      content: json['content'],
      sender: json['sender'],
      conversationId: json['conversationId'],
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
      'content': content,
      'sender': sender,
      'conversationId': conversationId,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
      if (deletedAt != null) 'deletedAt': deletedAt!.toIso8601String(),
      'syncStatus': syncStatus,
    };
  }
}
