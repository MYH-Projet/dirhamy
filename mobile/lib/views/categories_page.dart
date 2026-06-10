import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../controllers/category_controller.dart';
import '../utils/category_icons.dart';

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
  String _selectedIcon = 'local_offer';
  String? _editIcon;

  final List<String> _availableIcons = [
    'local_offer',
    'shopping_cart',
    'restaurant',
    'directions_car',
    'home',
    'medical_services',
    'movie',
    'card_giftcard',
    'receipt_long',
    'work',
    'school',
    'fitness_center',
    'flight',
    'coffee',
  ];

  @override
  void dispose() {
    _nameController.dispose();
    _editNameController.dispose();
    super.dispose();
  }

  Future<void> _addCategory() async {
    final name = _nameController.text.trim();
    if (name.isEmpty) return;
    
    await _categoryController.addCategory(name, icon: _selectedIcon);
    _nameController.clear();
    setState(() {
      _selectedIcon = 'local_offer';
    });
  }

  Future<void> _deleteCategory(int? id) async {
    if (id == null) return;
    await _categoryController.deleteCategory(id);
  }

  void _showIconPicker({required bool isEditing}) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Select Category Icon'),
        content: SizedBox(
          width: double.maxFinite,
          child: GridView.builder(
            shrinkWrap: true,
            itemCount: _availableIcons.length,
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 5,
              crossAxisSpacing: 12,
              mainAxisSpacing: 12,
            ),
            itemBuilder: (context, index) {
              final iconKey = _availableIcons[index];
              final currentSelected = isEditing ? _editIcon : _selectedIcon;
              final isSelected = iconKey == currentSelected;

              return GestureDetector(
                onTap: () {
                  setState(() {
                    if (isEditing) {
                      _editIcon = iconKey;
                    } else {
                      _selectedIcon = iconKey;
                    }
                  });
                  Navigator.pop(context);
                },
                child: Container(
                  decoration: BoxDecoration(
                    color: isSelected ? AppColors.primary.withOpacity(0.15) : Colors.transparent,
                    border: Border.all(
                      color: isSelected ? AppColors.primary : Colors.grey.shade300,
                      width: 2,
                    ),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(
                    CategoryIcons.getIcon(iconKey),
                    color: isSelected ? AppColors.primary : Colors.black87,
                  ),
                ),
              );
            },
          ),
        ),
      ),
    );
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
                      GestureDetector(
                        onTap: () => _showIconPicker(isEditing: false),
                        child: Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: AppColors.primary.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Icon(
                            CategoryIcons.getIcon(_selectedIcon),
                            color: AppColors.primary,
                          ),
                        ),
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
                                      if (isEditing) ...[
                                        GestureDetector(
                                          onTap: () => _showIconPicker(isEditing: true),
                                          child: Container(
                                            padding: const EdgeInsets.all(8),
                                            decoration: BoxDecoration(
                                              color: AppColors.primary.withOpacity(0.1),
                                              borderRadius: BorderRadius.circular(8),
                                            ),
                                            child: Icon(
                                              CategoryIcons.getIcon(_editIcon),
                                              color: AppColors.primary,
                                            ),
                                          ),
                                        ),
                                        const SizedBox(width: 16),
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
                                              cat.icon = _editIcon;
                                              cat.updatedAt = DateTime.now();
                                              await _categoryController.updateCategory(cat);
                                            }
                                            setState(() {
                                              _editingCategoryId = null;
                                              _editIcon = null;
                                            });
                                          },
                                        ),
                                        IconButton(
                                          icon: const Icon(Icons.close, color: Colors.grey),
                                          onPressed: () {
                                            setState(() {
                                              _editingCategoryId = null;
                                              _editIcon = null;
                                            });
                                          },
                                        ),
                                      ] else ...[
                                        Icon(
                                          CategoryIcons.getIcon(cat.icon),
                                          color: Colors.black87,
                                        ),
                                        const SizedBox(width: 16),
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
                                              _editIcon = cat.icon ?? 'local_offer';
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
