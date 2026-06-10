import 'package:flutter/material.dart';
import '../models/categorie_model.dart';
import '../repository/CategorieRepository.dart';
import '../repository/TransactionRepository.dart';

class BudgetController extends ChangeNotifier {
  // Singleton pattern for global access
  static final BudgetController _instance = BudgetController._internal();
  factory BudgetController() => _instance;
  BudgetController._internal();

  final CategorieRepository _categoryRepo = CategorieRepository();
  final TransactionRepository _txRepo = TransactionRepository();

  List<CategorieModel> categories = [];
  Map<int, double> spentByCategory = {};
  bool isLoading = false;

  Future<void> loadBudgets() async {
    isLoading = true;
    notifyListeners();
    DateTime thisMonth = DateTime(DateTime.now().year, DateTime.now().month, 1);
    try {
      final cats = await _categoryRepo.getAllCategories();
      Map<int, double> spent = {};
      
      for (var cat in cats) {
        if (cat.localId != null) {
          final txs = await _txRepo.getRecentTransactionsForBudget(
            limit: 1000,
            categorieId: cat.localId,
            date: thisMonth,
          );
          
          double catSpent = 0.0;
          for (var t in txs) {
            catSpent += t.transaction.amount;
          }
          spent[cat.localId!] = catSpent;
        }
      }

      // Show categories that either have a budget limit and have spending this month
      categories = cats.where((c) => (c.budgetLimit != null && c.budgetLimit! > 0) && (spent[c.localId] ?? 0) > 0).toList();
      spentByCategory = spent;
    } catch (e) {
      debugPrint('Error loading budgets: $e');
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }
}
