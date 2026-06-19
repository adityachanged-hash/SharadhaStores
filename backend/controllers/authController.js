// Predefined accounts mapping to user roles for prototyping
const PREDEFINED_USERS = [
  {
    email: 'admin@sharadha.com',
    password: 'admin123',
    name: 'Shila Devi',
    role: 'admin',
    roleLabel: 'Store Admin'
  },
  {
    email: 'inventory@sharadha.com',
    password: 'inventory123',
    name: 'Karan Singh',
    role: 'inventory_manager',
    roleLabel: 'Inventory Manager'
  },
  {
    email: 'dispatch@sharadha.com',
    password: 'dispatch123',
    name: 'Raju Pillai',
    role: 'dispatch',
    roleLabel: 'Dispatch Team'
  },
  {
    email: 'customer@gmail.com',
    password: 'customer123',
    name: 'Aditya Birla',
    role: 'customer',
    roleLabel: 'Corporate Customer'
  }
];

// POST /api/auth/login
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const user = PREDEFINED_USERS.find(
      u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials. Please verify your email and password.' });
    }

    // Exclude password from response
    const { password: _, ...userProfile } = user;

    // Generate a simple mock token
    const token = `mock-jwt-session-token-${user.role}-${Date.now().toString(16)}`;

    res.json({
      message: 'Login successful',
      token,
      user: userProfile
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login process', error: error.message });
  }
};
