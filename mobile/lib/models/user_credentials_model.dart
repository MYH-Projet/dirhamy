class UserCredentialsModel {
  int? localId;
  String email;
  String password;

  UserCredentialsModel({
    this.localId,
    required this.email,
    required this.password,
  });

  factory UserCredentialsModel.fromMap(Map<String, dynamic> map) {
    return UserCredentialsModel(
      localId: map['localId'],
      email: map['email'],
      password: map['password'],
    );
  }

  Map<String, dynamic> toMap() {
    return {
      if (localId != null) 'localId': localId,
      'email': email,
      'password': password,
    };
  }
}
