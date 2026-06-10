import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../controllers/category_controller.dart';

class CategoriesPage extends StatefulWidget {
  const CategoriesPage({super.key});

  @override
  State<CategoriesPage> createState() => _CategoriesPageState();
}

class _CategoriesPageState extends State<CategoriesPage> {
  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _editNameController = TextEditingController();
  final CategoryController _categoryController = CategoryController();
  int? _editingCategoryId;

  @override
  void dispose() {
    _nameController.dispose();
    _editNameController.dispose();
    super.dispose();
  }

  Future<void> _addCategory() async {
    final name = _nameController.text.trim();
    if (name.isEmpty) return;
    
    await _categoryController.addCategory(name);
    _nameController.clear();
  }

  Future<void> _deleteCategory(int? id) async {
    if (id == null) return;
    await _categoryController.deleteCategory(id);
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
      body: ListenableBuilder(
        listenable: _categoryController,
        builder: (context, child) {
          final categories = _categoryController.categories;

          return Padding(
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
                  child: _categoryController.isLoading && categories.isEmpty
                      ? const Center(child: CircularProgressIndicator())
                      : categories.isEmpty
                          ? const Center(child: Text('No categories yet.', style: TextStyle(color: Colors.grey)))
                          : ListView.separated(
                              itemCount: categories.length,
                              separatorBuilder: (context, index) => const SizedBox(height: 12),
                              itemBuilder: (context, index) {
                                final cat = categories[index];
                                final isEditing = cat.localId == _editingCategoryId;

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
                                      if (isEditing) ...[
                                        Expanded(
                                          child: TextField(
                                            controller: _editNameController,
                                            autofocus: true,
                                            decoration: const InputDecoration(
                                              border: InputBorder.none,
                                              hintText: 'Category name',
                                            ),
                                          ),
                                        ),
                                        IconButton(
                                          icon: const Icon(Icons.check, color: AppColors.primary),
                                          onPressed: () async {
                                            final newName = _editNameController.text.trim();
                                            if (newName.isNotEmpty) {
                                              cat.nom = newName;
                                              cat.updatedAt = DateTime.now();
                                              await _categoryController.updateCategory(cat);
                                            }
                                            setState(() {
                                              _editingCategoryId = null;
                                            });
                                          },
                                        ),
                                        IconButton(
                                          icon: const Icon(Icons.close, color: Colors.grey),
                                          onPressed: () {
                                            setState(() {
                                              _editingCategoryId = null;
                                            });
                                          },
                                        ),
                                      ] else ...[
                                        Expanded(
                                          child: Text(
                                            cat.nom,
                                            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w500),
                                          ),
                                        ),
                                        IconButton(
                                          icon: const Icon(Icons.edit, color: Colors.grey),
                                          onPressed: () {
                                            setState(() {
                                              _editingCategoryId = cat.localId;
                                              _editNameController.text = cat.nom;
                                            });
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
                                    ],
                                  ),
                                );
                              },
                            ),
                )
              ],
            ),
          );
        },
      ),
    );
  }
}
