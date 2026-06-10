import 'package:flutter/material.dart';
import '../models/categorie_model.dart';
import '../repository/CategorieRepository.dart';
import 'budget_controller.dart';

class CategoryController extends ChangeNotifier {
  // Singleton pattern for global access
  static final CategoryController _instance = CategoryController._internal();
  factory CategoryController() => _instance;
  CategoryController._internal();

  final CategorieRepository _repository = CategorieRepository();

  List<CategorieModel> categories = [];
  bool isLoading = false;

  Future<void> loadCategories() async {
    isLoading = true;
    notifyListeners();
    try {
      categories = await _repository.getAllCategories();
    } catch (e) {
      debugPrint('Error loading categories: $e');
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

  Future<void> addCategory(String name) async {
    if (name.isEmpty) return;
    final newCat = CategorieModel(
      nom: name,
      updatedAt: DateTime.now(),
      syncStatus: 0,
    );
    await _repository.addCategory(newCat);
    await loadCategories();
    // Trigger budget update as category list has changed
    await BudgetController().loadBudgets();
  }

  Future<void> deleteCategory(int? id) async {
    if (id == null) return;
    await _repository.deleteCategory(id);
    await loadCategories();
    // Trigger budget update as category list has changed
    await BudgetController().loadBudgets();
  }
}
