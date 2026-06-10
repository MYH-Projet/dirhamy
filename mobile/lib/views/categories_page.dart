import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../models/categorie_model.dart';
import '../repository/CategorieRepository.dart';

class CategoriesPage extends StatefulWidget {
  const CategoriesPage({super.key});

  @override
  State<CategoriesPage> createState() => _CategoriesPageState();
}

class _CategoriesPageState extends State<CategoriesPage> {
  List<CategorieModel> categories = [];
  final TextEditingController _nameController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadCategories();
  }

  Future<void> _loadCategories() async {
    final fetched = await CategorieRepository().getAllCategories();
    if (mounted) {
      setState(() {
        categories = fetched;
      });
    }
  }

  Future<void> _addCategory() async {
    final name = _nameController.text.trim();
    if (name.isEmpty) return;
    
    final newCat = CategorieModel(
      nom: name,
      updatedAt: DateTime.now(),
      syncStatus: 0,
    );
    await CategorieRepository().addCategory(newCat);
    _nameController.clear();
    _loadCategories();
  }

  Future<void> _deleteCategory(int? id) async {
    if (id == null) return;
    await CategorieRepository().deleteCategory(id);
    _loadCategories();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.lightestGray,
      appBar: AppBar(
        backgroundColor: AppColors.lightestGray,
        elevation: 0,
        centerTitle: true,
        title: const Text('Manage Categories', style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            // Add Category Card
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, 4))
                ],
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(color: AppColors.lightestGray, borderRadius: BorderRadius.circular(8)),
                    child: const Icon(Icons.local_offer_outlined, color: Colors.grey),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: TextField(
                      controller: _nameController,
                      decoration: const InputDecoration(
                        hintText: 'Category name',
                        border: InputBorder.none,
                      ),
                    ),
                  ),
                  ElevatedButton(
                    onPressed: _addCategory,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    child: const Text('Add', style: TextStyle(color: Colors.white)),
                  )
                ],
              ),
            ),
            const SizedBox(height: 24),
            Expanded(
              child: categories.isEmpty
                  ? const Center(child: Text('No categories yet.', style: TextStyle(color: Colors.grey)))
                  : ListView.separated(
                      itemCount: categories.length,
                      separatorBuilder: (context, index) => const SizedBox(height: 12),
                      itemBuilder: (context, index) {
                        final cat = categories[index];
                        return Container(
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(16),
                            boxShadow: [
                              BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 8, offset: const Offset(0, 2))
                            ],
                          ),
                          child: Row(
                            children: [
                              const Icon(Icons.category, color: Colors.black87),
                              const SizedBox(width: 16),
                              Expanded(child: Text(cat.nom, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w500))),
                              IconButton(
                                icon: const Icon(Icons.edit, color: Colors.grey),
                                onPressed: () {
                                  // Edit logic goes here
                                },
                              ),
                              Container(
                                decoration: BoxDecoration(
                                  color: AppColors.redish,
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: IconButton(
                                  icon: const Icon(Icons.delete_outline, color: Colors.white),
                                  onPressed: () => _deleteCategory(cat.localId),
                                ),
                              ),
                            ],
                          ),
                        );
                      },
                    ),
            )
          ],
        ),
      ),
    );
  }
}
