import 'package:flutter/material.dart';
import '../models/transaction_model.dart';
import '../repository/TransactionRepository.dart';
import 'account_controller.dart';
import 'budget_controller.dart';

class TransactionController extends ChangeNotifier {
  // Singleton pattern for global access
  static final TransactionController _instance = TransactionController._internal();
  factory TransactionController() => _instance;
  TransactionController._internal();

  final TransactionRepository _repository = TransactionRepository();

  List<TransactionWithCategory> transactions = [];
  bool isLoading = false;

  Future<void> loadTransactions() async {
    isLoading = true;
    notifyListeners();
    try {
      transactions = await _repository.getRecentTransactionsWithCategory();
    } catch (e) {
      debugPrint('Error loading transactions: $e');
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

  Future<void> addTransaction(TransactionModel transaction) async {
    await _repository.addTransaction(transaction);
    // Reload transactions list, account balances, and budgets!
    await loadTransactions();
    await AccountController().loadAccountsAndBalances();
    await BudgetController().loadBudgets();
  }

  Future<void> deleteTransaction(int id) async {
    await _repository.deleteTransaction(id);
    // Reload transactions list, account balances, and budgets!
    await loadTransactions();
    await AccountController().loadAccountsAndBalances();
    await BudgetController().loadBudgets();
  }
}
