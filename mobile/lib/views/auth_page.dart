import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../controllers/auth_controller.dart';
import '../services/auth_service.dart';

class AuthPage extends StatefulWidget {
  const AuthPage({super.key});

  @override
  State<AuthPage> createState() => _AuthPageState();
}

class _AuthPageState extends State<AuthPage> {
  final AuthController _authController = AuthController();
  
  bool _isLogin = true;

  // Login Controllers
  final _loginMailController = TextEditingController();
  final _loginPassController = TextEditingController();

  // Register Controllers
  final _regNomController = TextEditingController();
  final _regPrenomController = TextEditingController();
  final _regMailController = TextEditingController();
  final _regPassController = TextEditingController();
  final _regConfirmPassController = TextEditingController();

  @override
  void dispose() {
    _loginMailController.dispose();
    _loginPassController.dispose();
    _regNomController.dispose();
    _regPrenomController.dispose();
    _regMailController.dispose();
    _regPassController.dispose();
    _regConfirmPassController.dispose();
    super.dispose();
  }

  void _toggleMode() {
    setState(() {
      _isLogin = !_isLogin;
    });
  }

  Future<void> _submit() async {
    if (_isLogin) {
      final mail = _loginMailController.text.trim();
      final pass = _loginPassController.text.trim();
      if (mail.isEmpty || pass.isEmpty) {
        _showSnack('Please fill in all fields');
        return;
      }
      
      final errorMessage = await _authController.login(mail, pass);
      if (errorMessage == null) {
        final token = await AuthService.getStoredCookie();
        print('you login seccusfully and your token is $token');
        if (mounted) Navigator.pop(context);
      } else if (mounted) {
        _showSnack(errorMessage);
      }
    } else {
      final nom = _regNomController.text.trim();
      final prenom = _regPrenomController.text.trim();
      final mail = _regMailController.text.trim();
      final pass = _regPassController.text.trim();
      final confirm = _regConfirmPassController.text.trim();

      if (nom.isEmpty || prenom.isEmpty || mail.isEmpty || pass.isEmpty) {
        _showSnack('Please fill in all fields');
        return;
      }
      if (pass != confirm) {
        _showSnack('Passwords do not match');
        return;
      }

      final errorMessage = await _authController.register(nom, prenom, mail, pass);
      if (errorMessage == null) {
        final token = await AuthService.getStoredCookie();
        print('you login seccusfully and your token is $token');
        if (mounted) Navigator.pop(context);
      } else if (mounted) {
        _showSnack(errorMessage);
      }
    }
  }

  void _showSnack(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message)),
    );
  }

  Widget _buildTextField(TextEditingController controller, String hint, IconData icon, {bool isPassword = false}) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.8),
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          )
        ],
      ),
      child: TextField(
        controller: controller,
        obscureText: isPassword,
        decoration: InputDecoration(
          prefixIcon: Icon(icon, color: AppColors.primary),
          hintText: hint,
          border: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.lightestGray,
      body: ListenableBuilder(
        listenable: _authController,
        builder: (context, child) {
          return SafeArea(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const SizedBox(height: 60),
                  const Icon(
                    Icons.account_balance_wallet_rounded,
                    size: 80,
                    color: AppColors.primary,
                  ),
                  const SizedBox(height: 16),
                  Text(
                    _isLogin ? 'Welcome Back' : 'Create Account',
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      fontSize: 32,
                      fontWeight: FontWeight.bold,
                      color: AppColors.blackText,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    _isLogin ? 'Login to manage your finances' : 'Sign up to get started',
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      fontSize: 16,
                      color: Colors.grey,
                    ),
                  ),
                  const SizedBox(height: 48),

                  if (_isLogin) ...[
                    _buildTextField(_loginMailController, 'Email', Icons.email_outlined),
                    _buildTextField(_loginPassController, 'Password', Icons.lock_outline, isPassword: true),
                  ] else ...[
                    Row(
                      children: [
                        Expanded(child: _buildTextField(_regNomController, 'Last Name', Icons.person_outline)),
                        const SizedBox(width: 16),
                        Expanded(child: _buildTextField(_regPrenomController, 'First Name', Icons.person_outline)),
                      ],
                    ),
                    _buildTextField(_regMailController, 'Email', Icons.email_outlined),
                    _buildTextField(_regPassController, 'Password', Icons.lock_outline, isPassword: true),
                    _buildTextField(_regConfirmPassController, 'Confirm Password', Icons.lock_outline, isPassword: true),
                  ],

                  const SizedBox(height: 24),
                  SizedBox(
                    height: 56,
                    child: ElevatedButton(
                      onPressed: _authController.isLoading ? null : _submit,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                        ),
                        elevation: 4,
                      ),
                      child: _authController.isLoading
                          ? const SizedBox(
                              height: 24,
                              width: 24,
                              child: CircularProgressIndicator(color: Colors.white, strokeWidth: 3),
                            )
                          : Text(
                              _isLogin ? 'Login' : 'Register',
                              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white),
                            ),
                    ),
                  ),
                  const SizedBox(height: 24),
                  TextButton(
                    onPressed: _authController.isLoading ? null : _toggleMode,
                    child: RichText(
                      text: TextSpan(
                        style: const TextStyle(color: Colors.grey, fontSize: 16),
                        children: [
                          TextSpan(text: _isLogin ? "Don't have an account? " : "Already have an account? "),
                          TextSpan(
                            text: _isLogin ? "Register here" : "Login here",
                            style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}
