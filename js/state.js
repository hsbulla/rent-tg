const storageKey = 'renthub_state_v1';
const storageAvailable = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

const defaultUsers = [
  {
    id: 'u-renter',
    name: 'Марина Савельева',
    email: 'renter@renthub.dev',
    password: 'demo123',
    role: 'renter'
  },
  {
    id: 'u-owner',
    name: 'Илья Новиков',
    email: 'owner@renthub.dev',
    password: 'demo123',
    role: 'owner'
  }
];

const defaultEquipment = [
  {
    id: 'eq-1',
    name: 'Перфоратор Bosch GBH 2-26',
    category: 'Электроинструмент',
    pricePerDay: 1800,
    location: 'Москва',
    status: 'active',
    ownerId: 'u-owner',
    image: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=800&q=60',
    description: 'Профессиональный перфоратор для интенсивных работ по бетону и кирпичу.',
    rating: 4.9,
    reviews: 32,
    labels: ['ТОП'],
    specs: {
      Бренд: 'Bosch',
      Мощность: '800 Вт',
      Вес: '2.7 кг',
      Питание: '220 В'
    }
  },
  {
    id: 'eq-2',
    name: 'Газонокосилка Husqvarna LC 253S',
    category: 'Садовая техника',
    pricePerDay: 2400,
    location: 'Санкт-Петербург',
    status: 'active',
    ownerId: 'u-owner',
    image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=60',
    description: 'Самоходная бензиновая газонокосилка с шириной захвата 53 см.',
    rating: 4.7,
    reviews: 18,
    labels: ['Новое'],
    specs: {
      Бренд: 'Husqvarna',
      Мощность: '2.7 кВт',
      Вес: '32 кг',
      Питание: 'Бензин'
    }
  },
  {
    id: 'eq-3',
    name: 'Передвижные строительные леса 5м',
    category: 'Леса и вышки',
    pricePerDay: 3200,
    location: 'Москва',
    status: 'active',
    ownerId: 'u-owner',
    image: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=800&q=60',
    description: 'Мобильные леса с быстрой сборкой, комплект с колесами и стабилизаторами.',
    rating: 4.6,
    reviews: 12,
    labels: ['ТОП'],
    specs: {
      Высота: '5 метров',
      Материал: 'Алюминий',
      Вес: '68 кг',
      Комплектация: 'Колеса, упоры'
    }
  }
];

const defaultOrders = [
  {
    id: 'ord-1',
    equipmentId: 'eq-1',
    renterId: 'u-renter',
    ownerId: 'u-owner',
    startDate: '2025-04-10',
    endDate: '2025-04-14',
    status: 'awaiting_payment',
    total: 7200,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 3
  }
];

const adminCredentials = {
  email: 'admin@renthub.dev',
  password: 'admin123',
  name: 'Команда RentHub'
};

const state = {
  currentUser: null,
  users: [],
  equipment: [],
  orders: [],
  adminSession: null
};

const listeners = new Set();

function hydrate() {
  if (storageAvailable) {
    try {
      const snapshot = JSON.parse(localStorage.getItem(storageKey));
      if (snapshot) {
        state.users = snapshot.users || [];
        state.equipment = snapshot.equipment || [];
        state.orders = snapshot.orders || [];
        state.currentUser = snapshot.currentUser || null;
        state.adminSession = snapshot.adminSession || null;
        return;
      }
    } catch (err) {
      console.warn('Failed to read storage, fallback to defaults', err);
    }
  }
  state.users = [...defaultUsers];
  state.equipment = [...defaultEquipment];
  state.orders = [...defaultOrders];
  state.adminSession = null;
}

function persist() {
  if (!storageAvailable) return;
  const snapshot = {
    currentUser: state.currentUser,
    users: state.users,
    equipment: state.equipment,
    orders: state.orders,
    adminSession: state.adminSession
  };
  try {
    localStorage.setItem(storageKey, JSON.stringify(snapshot));
  } catch (err) {
    console.warn('Unable to save state', err);
  }
}

function notify() {
  persist();
  listeners.forEach((cb) => cb(state));
}

function subscribe(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function generateId(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

function sanitizeUser(user) {
  if (!user) return null;
  // eslint-disable-next-line no-unused-vars
  const { password, ...rest } = user;
  return rest;
}

function loginAdmin(email, password) {
  if (email === adminCredentials.email && password === adminCredentials.password) {
    state.adminSession = { email: adminCredentials.email, name: adminCredentials.name };
    notify();
    return { success: true, profile: state.adminSession };
  }
  return { success: false, message: 'Неверные данные администратора' };
}

function logoutAdmin() {
  state.adminSession = null;
  notify();
}

function login(email, password) {
  const user = state.users.find((u) => u.email === email && u.password === password);
  if (!user) {
    return { success: false, message: 'Неверный email или пароль' };
  }
  state.currentUser = sanitizeUser(user);
  notify();
  return { success: true, user: state.currentUser };
}

function logout() {
  state.currentUser = null;
  notify();
}

function register({ name, email, password, role }) {
  if (!name || !email || !password || !role) {
    return { success: false, message: 'Заполните все поля' };
  }
  const exists = state.users.some((u) => u.email === email);
  if (exists) {
    return { success: false, message: 'Пользователь с таким email уже существует' };
  }
  const newUser = {
    id: generateId('u'),
    name,
    email,
    password,
    role
  };
  state.users.push(newUser);
  state.currentUser = sanitizeUser(newUser);
  notify();
  return { success: true, user: state.currentUser };
}

function addEquipment(data) {
  if (!state.currentUser || state.currentUser.role !== 'owner') {
    return { success: false, message: 'Только арендодатели могут добавлять оборудование' };
  }
  const newEquipment = {
    id: generateId('eq'),
    ownerId: state.currentUser.id,
    status: 'active',
    rating: 4.8,
    reviews: 0,
    labels: data.labels || [],
    specs: data.specs || {},
    ...data
  };
  state.equipment.unshift(newEquipment);
  notify();
  return { success: true, equipment: newEquipment };
}

function updateEquipment(equipmentId, patch) {
  const item = state.equipment.find((eq) => eq.id === equipmentId);
  if (!item) return { success: false, message: 'Не найдено' };
  Object.assign(item, patch);
  notify();
  return { success: true, equipment: item };
}

function getEquipmentById(id) {
  return state.equipment.find((eq) => eq.id === id) || null;
}

function createOrder({ equipmentId, startDate, endDate }) {
  if (!state.currentUser || state.currentUser.role !== 'renter') {
    return { success: false, message: 'Для бронирования войдите как арендатор' };
  }
  const equipment = getEquipmentById(equipmentId);
  if (!equipment) {
    return { success: false, message: 'Оборудование не найдено' };
  }
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (!(start instanceof Date) || !(end instanceof Date) || start > end) {
    return { success: false, message: 'Выберите корректные даты' };
  }
  const days = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1);
  const total = days * equipment.pricePerDay;
  const newOrder = {
    id: generateId('ord'),
    equipmentId,
    renterId: state.currentUser.id,
    ownerId: equipment.ownerId,
    startDate,
    endDate,
    status: 'awaiting_payment',
    total,
    createdAt: Date.now()
  };
  state.orders.unshift(newOrder);
  notify();
  return { success: true, order: newOrder };
}

function updateOrderStatus(orderId, status) {
  const order = state.orders.find((o) => o.id === orderId);
  if (!order) {
    return { success: false, message: 'Заказ не найден' };
  }
  order.status = status;
  notify();
  return { success: true, order };
}

function getOrdersByRenter(renterId) {
  return state.orders.filter((order) => order.renterId === renterId);
}

function getOrdersByOwner(ownerId) {
  return state.orders.filter((order) => order.ownerId === ownerId);
}

function getAggregatedStats() {
  const renters = state.users.filter((user) => user.role === 'renter').length;
  const owners = state.users.filter((user) => user.role === 'owner').length;
  const activeOrders = state.orders.filter((order) => order.status !== 'completed').length;
  const completedOrders = state.orders.filter((order) => order.status === 'completed').length;
  const revenue = state.orders
    .filter((order) => ['paid', 'in_progress', 'completed'].includes(order.status))
    .reduce((acc, order) => acc + order.total, 0);
  return {
    totalUsers: state.users.length,
    renters,
    owners,
    totalOrders: state.orders.length,
    activeOrders,
    completedOrders,
    revenue
  };
}

hydrate();

export {
  state,
  subscribe,
  login,
  logout,
  register,
  addEquipment,
  updateEquipment,
  createOrder,
  updateOrderStatus,
  getEquipmentById,
  getOrdersByRenter,
  getOrdersByOwner,
  getAggregatedStats,
  loginAdmin,
  logoutAdmin
};
