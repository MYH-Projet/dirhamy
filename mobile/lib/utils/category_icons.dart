import 'package:flutter/material.dart';

class CategoryIcons {
  static const Map<String, IconData> iconMap = {
    'local_offer': Icons.local_offer_outlined,
    'shopping_cart': Icons.shopping_cart_outlined,
    'restaurant': Icons.restaurant_outlined,
    'directions_car': Icons.directions_car_outlined,
    'home': Icons.home_outlined,
    'medical_services': Icons.medical_services_outlined,
    'movie': Icons.movie_outlined,
    'card_giftcard': Icons.card_giftcard_outlined,
    'receipt_long': Icons.receipt_long_outlined,
    'work': Icons.work_outline,
    'school': Icons.school_outlined,
    'fitness_center': Icons.fitness_center_outlined,
    'flight': Icons.flight_outlined,
    'coffee': Icons.coffee_outlined,
  };

  static IconData getIcon(String? name) {
    return iconMap[name] ?? Icons.local_offer_outlined;
  }
}
