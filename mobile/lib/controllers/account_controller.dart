import 'package:flutter/material.dart';
import '../models/compte_model.dart';
import '../repository/AccountRepository.dart';
import '../repository/TransactionRepository.dart';

class AccountController extends ChangeNotifier {
  // Singleton pattern so we can access the same instance globally
  static final AccountController _instance = AccountController._internal();
  factory AccountController() => _instance;
  AccountController._internal();

  final AccountRepository _accountRepo = AccountRepository();
  final TransactionRepository _txRepo = TransactionRepository();

  List<CompteModel> accounts = [];
  double totalBalance = 0.0;
  double cashBalance = 0.0;
  double bankBalance = 0.0;
  bool isLoading = false;

  Future<void> loadAccountsAndBalances() async {
    isLoading = true;
    notifyListeners();
    try {
      accounts = await _accountRepo.getAllAccounts();
      double cashTemp = 0.0;
      double bankTemp = 0.0;
      for (final compte in accounts) {
        if (compte.localId != null) {
          final balance = await _txRepo.getBalance(compte.localId!);
          if (compte.type == 'cash') {
            cashTemp += balance;
          } else {
            bankTemp += balance;
          }
        }
      }
      cashBalance = cashTemp;
      bankBalance = bankTemp;
      totalBalance = cashTemp + bankTemp;
    } catch (e) {
      debugPrint('Error loading accounts and balances: $e');
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }
}
