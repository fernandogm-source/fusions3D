require("dotenv").config();

const mongoose = require("mongoose");
const Category = require("./src/models/category.model");
const Material = require("./src/models/material.model");
const Print = require("./src/models/print.model");
const PrintVariant = require("./src/models/printVariant.model");
const Role = require("./src/models/role.model");
const User = require("./src/models/user.model");
const Profile = require("./src/models/profile.model");
const Image = require("./src/models/image.model");
const RevokedToken = require("./src/models/revoked-token.model");
const { hashPassword } = require("./src/utils/password.util");
const { buildSkuBase } = require("./src/utils/sku.util");
const { toSlug } = require("./src/utils/slug.util");

const roles = ["ADMIN", "USER"].map((name) => ({ name, isActive: true, deletedAt: null }));

const materials = ["PLA", "PETG", "ABS", "TPU", "Resin", "Nylon"].map((name) => ({
  name,
  slug: toSlug(name),
  isActive: true,
  deletedAt: null,
}));

const COLORS = {
  Negro: "#1F1F1F",
  Blanco: "#F5F5F5",
  Gris: "#9CA3AF",
  Azul: "#2563EB",
  Rojo: "#DC2626",
  Verde: "#16A34A",
  Amarillo: "#FACC15",
  Naranja: "#FF6000",
  Morado: "#7C3AED",
  Rosa: "#EC4899",
  Turquesa: "#14B8A6",
  Beige: "#D6C3A5",
};

const categories = [
  {
    name: "Accesorios y Escritorio",
    slug: "accesorios-y-escritorio",
    status: "published",
  },
  {
    name: "Hogar y Decoración",
    slug: "hogar-y-decoracion",
    status: "published",
  },
  {
    name: "Figuras y Coleccionables",
    slug: "figuras-y-coleccionables",
    status: "published",
  },
  {
    name: "Electrónica y Maker",
    slug: "electronica-y-maker",
    status: "published",
  },
  {
    name: "Juguetes y Juegos",
    slug: "juguetes-y-juegos",
    status: "published",
  },
  {
    name: "Joyería y Complementos",
    slug: "joyeria-y-complementos",
    status: "published",
  },
  {
    name: "Arte y Diseño",
    slug: "arte-y-diseno",
    status: "published",
  },
  {
    name: "Próximamente",
    slug: "proximamente",
    status: "draft",
  },
].map((category) => ({ ...category, isActive: true, deletedAt: null }));

const GALLERY_SIZE = 4;

/** Foto real de picsum.photos. La misma semilla devuelve siempre la misma imagen. */
function picsum(seed) {
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/800/600`;
}

/** Foto de muestra identificada por un texto; la semilla sale del texto. */
function photo(text) {
  return picsum(toSlug(text));
}

/** Galería de una impresión: sus imágenes propias y, si faltan, fotos de picsum hasta completar GALLERY_SIZE. */
function gallery(print) {
  const urls = [...new Set(print.images)];
  for (let n = 1; urls.length < GALLERY_SIZE; n++) {
    urls.push(picsum(`${print.slug}-${n}`));
  }
  return urls.slice(0, GALLERY_SIZE);
}

/** Atajo para escribir variantes: material, color, precio de venta, coste, minutos de impresión. */
function variant(material, color, salePrice, costPrice, printTime, isActive = true) {
  return { material, color, salePrice, costPrice, printTime, isActive };
}

const printData = [
  // ---------- Accesorios y Escritorio ----------
  {
    name: "Soporte para móvil",
    slug: "soporte-para-movil",
    categorySlug: "accesorios-y-escritorio",
    status: "published",
    description:
      "Soporte de escritorio para teléfono móvil, con ángulo de visión regulable y base antideslizante. " +
      "Compatible con la mayoría de smartphones de hasta 9 cm de ancho. Ideal para videollamadas y recetas en la cocina.",
    images: [
      "https://images.pexels.com/photos/29148783/pexels-photo-29148783.jpeg?auto=compress&cs=tinysrgb&w=900",
      photo("Soporte para móvil - detalle"),
    ],
    variants: [
      variant("PLA", "Negro", 12.5, 4.2, 180),
      variant("PETG", "Azul", 15.9, 5.3, 210),
      variant("PLA", "Blanco", 12.5, 4.1, 175),
      variant("PETG", "Rojo", 15.9, 5.4, 210),
    ],
  },
  {
    name: "Organizador de cables",
    slug: "organizador-de-cables",
    categorySlug: "accesorios-y-escritorio",
    status: "draft",
    description:
      "Organizador compacto para mantener ordenados cables de escritorio. Se fija con adhesivo o tornillo " +
      "y admite hasta seis cables de cargador a la vez.",
    images: [
      "https://images.pexels.com/photos/19583534/pexels-photo-19583534.jpeg?auto=compress&cs=tinysrgb&w=900",
    ],
    variants: [
      variant("PLA", "Gris", 8.5, 2.3, 120),
      variant("TPU", "Negro", 9.9, 3.1, 140),
    ],
  },
  {
    name: "Soporte para auriculares",
    slug: "soporte-para-auriculares",
    categorySlug: "accesorios-y-escritorio",
    status: "published",
    description:
      "Soporte estable para auriculares de diadema con base pesada que no se vuelca. " +
      "Diseño minimalista que libera espacio sobre la mesa.",
    images: [photo("Soporte para auriculares"), photo("Soporte para auriculares - vista lateral")],
    variants: [
      variant("PLA", "Negro", 14.9, 5.0, 230),
      variant("PETG", "Gris", 16.5, 5.8, 250),
      variant("ABS", "Blanco", 15.5, 5.2, 240),
    ],
  },
  {
    name: "Llavero personalizado",
    slug: "llavero-personalizado",
    categorySlug: "accesorios-y-escritorio",
    status: "published",
    description:
      "Llavero ligero con anilla metálica incluida. Disponible en varios materiales y colores, " +
      "perfecto como detalle o para identificar tus llaves.",
    images: [photo("Llavero personalizado"), photo("Llavero personalizado - detalle")],
    variants: [
      variant("PLA", "Rojo", 3.5, 0.9, 25),
      variant("PLA", "Verde", 3.5, 0.9, 25),
      variant("TPU", "Negro", 4.5, 1.4, 35),
      variant("Nylon", "Naranja", 6.0, 2.1, 45),
    ],
  },
  {
    name: "Portalápices geométrico",
    slug: "portalapices-geometrico",
    categorySlug: "accesorios-y-escritorio",
    status: "published",
    description:
      "Portalápices de superficie facetada con fondo reforzado para que no se mueva. " +
      "Capacidad para bolígrafos, lápices y pinceles de maquillaje.",
    images: [photo("Portalápices geométrico")],
    variants: [
      variant("PLA", "Blanco", 9.9, 3.0, 150),
      variant("PETG", "Turquesa", 11.5, 3.6, 170),
    ],
  },

  // ---------- Hogar y Decoración ----------
  {
    name: "Maceta geométrica",
    slug: "maceta-geometrica",
    categorySlug: "hogar-y-decoracion",
    status: "published",
    description:
      "Maceta decorativa con diseño geométrico y drenaje inferior. Pensada para plantas pequeñas y suculentas. " +
      "Incluye plato de recogida de agua; el diámetro aproximado es de 12 cm.",
    images: [
      "https://images.pexels.com/photos/7222203/pexels-photo-7222203.jpeg?auto=compress&cs=tinysrgb&w=900",
      photo("Maceta geométrica - vista superior"),
    ],
    variants: [
      variant("PETG", "Blanco", 18.9, 6.75, 360),
      variant("PLA", "Gris", 16.5, 5.9, 330),
      variant("Resin", "Beige", 24.5, 9.2, 420),
    ],
  },
  {
    name: "Lámpara de mesa",
    slug: "lampara-de-mesa",
    categorySlug: "hogar-y-decoracion",
    status: "published",
    description:
      "Lámpara de mesa con pantalla translúcida que difumina la luz. Compatible con bombillas LED E27 (no incluidas). " +
      "Cable de 1,5 m con interruptor en la base.",
    images: [photo("Lámpara de mesa"), photo("Lámpara de mesa - encendida")],
    variants: [
      variant("PLA", "Blanco", 34.9, 12.0, 900),
      variant("PLA", "Naranja", 36.9, 12.5, 900),
      variant("PETG", "Beige", 39.9, 13.4, 960),
    ],
  },
  {
    name: "Posavasos hexagonal",
    slug: "posavasos-hexagonal",
    categorySlug: "hogar-y-decoracion",
    status: "published",
    description:
      "Juego de posavasos con forma hexagonal y superficie antideslizante. " +
      "Resistentes al calor de tazas y vasos recién servidos.",
    images: [photo("Posavasos hexagonal")],
    variants: [
      variant("PLA", "Verde", 6.5, 2.0, 90),
      variant("PETG", "Azul", 7.5, 2.4, 105),
    ],
  },
  {
    name: "Percha de pared",
    slug: "percha-de-pared",
    categorySlug: "hogar-y-decoracion",
    status: "published",
    description:
      "Percha de pared con tres ganchos reforzados para abrigos, bolsos y toallas. " +
      "Incluye tacos y tornillos para fijación sencilla.",
    images: [photo("Percha de pared")],
    variants: [
      variant("PLA", "Negro", 11.9, 3.9, 200),
      variant("ABS", "Gris", 13.9, 4.5, 230),
    ],
  },

  // ---------- Figuras y Coleccionables ----------
  {
    name: "Figura decorativa",
    slug: "figura-decorativa",
    categorySlug: "figuras-y-coleccionables",
    status: "published",
    description:
      "Figura decorativa de sobremesa con acabado pensado para impresión FDM y resina. " +
      "Altura aproximada de 15 cm, base plana para mantenerse de pie.",
    images: [
      "https://images.pexels.com/photos/14158951/pexels-photo-14158951.jpeg?auto=compress&cs=tinysrgb&w=900",
      photo("Figura decorativa - perfil"),
    ],
    variants: [
      variant("Resin", "Gris", 24.9, 9.8, 540),
      variant("PLA", "Blanco", 19.9, 7.0, 420),
    ],
  },
  {
    name: "Dragón articulado",
    slug: "dragon-articulado",
    categorySlug: "figuras-y-coleccionables",
    status: "published",
    description:
      "Dragón articulado impreso en una sola pieza: las alas y la cola se mueven sin montaje. " +
      "Envergadura de unos 25 cm, con escamas detalladas.",
    images: [photo("Dragón articulado"), photo("Dragón articulado - alas")],
    variants: [
      variant("PLA", "Verde", 29.9, 10.0, 900),
      variant("PLA", "Morado", 31.9, 10.6, 930),
      variant("TPU", "Negro", 35.0, 13.2, 1020),
    ],
  },
  {
    name: "Estatua minimalista",
    slug: "estatua-minimalista",
    categorySlug: "figuras-y-coleccionables",
    status: "published",
    description:
      "Estatua minimalista de líneas limpias, pensada como pieza de colección. " +
      "Acabado mate en PLA y resina de alto detalle para las versiones de color.",
    images: [photo("Estatua minimalista")],
    variants: [
      variant("PLA", "Blanco", 22.5, 7.8, 480),
      variant("Resin", "Negro", 28.5, 10.9, 600),
    ],
  },

  // ---------- Electrónica y Maker ----------
  {
    name: "Caja para electrónica",
    slug: "caja-para-electronica",
    categorySlug: "electronica-y-maker",
    status: "archived",
    description:
      "Caja modular para pequeños proyectos electrónicos y placas de desarrollo. " +
      "Tapa a presión y orificios de ventilación. Versión retirada del catálogo.",
    images: [
      "https://images.pexels.com/photos/20341728/pexels-photo-20341728.jpeg?auto=compress&cs=tinysrgb&w=900",
    ],
    variants: [variant("ABS", "Negro", 16.75, 5.6, 300)],
  },
  {
    name: "Carcasa para Raspberry Pi",
    slug: "carcasa-para-raspberry-pi",
    categorySlug: "electronica-y-maker",
    status: "published",
    description:
      "Carcasa para Raspberry Pi 4 con ventilación lateral y acceso a todos los puertos. " +
      "Incluye espacio para un pequeño ventilador de 30 mm y tornillería de montaje.",
    images: [photo("Carcasa Raspberry Pi"), photo("Carcasa Raspberry Pi - puertos")],
    variants: [
      variant("ABS", "Negro", 14.5, 5.0, 240),
      variant("PETG", "Azul", 13.9, 4.6, 230),
    ],
  },
  {
    name: "Brazo de sujeción para cámara",
    slug: "brazo-de-sujecion-para-camara",
    categorySlug: "electronica-y-maker",
    status: "published",
    description:
      "Brazo articulado para sujetar cámaras de acción o pequeños micrófonos. Tuerca de rosca estándar 1/4\". " +
      "Fabricado en nailon para una resistencia superior a las vibraciones.",
    images: [photo("Brazo de sujeción")],
    variants: [variant("Nylon", "Negro", 22.5, 8.0, 420)],
  },

  // ---------- Juguetes y Juegos ----------
  {
    name: "Coche de carreras",
    slug: "coche-de-carreras",
    categorySlug: "juguetes-y-juegos",
    status: "published",
    description:
      "Coche de carreras de diseño aerodinámico para niños a partir de 5 años. " +
      "Ruedas giratorias y chasis reforzado para aguantar las caídas del juego.",
    images: [photo("Coche de carreras"), photo("Coche de carreras - lateral")],
    variants: [
      variant("PLA", "Rojo", 9.9, 3.2, 150),
      variant("PLA", "Amarillo", 9.9, 3.2, 150),
    ],
  },
  {
    name: "Puzzle 3D de animales",
    slug: "puzzle-3d-de-animales",
    categorySlug: "juguetes-y-juegos",
    status: "published",
    description:
      "Puzzle tridimensional con piezas de encaje sin pegamento. Incluye cinco animales de la granja " +
      "y una guía de montaje ilustrada para niños de 6 años en adelante.",
    images: [photo("Puzzle 3D de animales")],
    variants: [
      variant("PLA", "Verde", 15.5, 5.1, 360),
      variant("PLA", "Naranja", 15.5, 5.1, 360),
    ],
  },
  {
    name: "Peonza clásica",
    slug: "peonza-clasica",
    categorySlug: "juguetes-y-juegos",
    status: "published",
    description:
      "Peonza de equilibrio estable con punta de acero recambiable. Gira durante más de un minuto " +
      "y es uno de los juguetes más resistentes de nuestro catálogo.",
    images: [photo("Peonza clásica")],
    variants: [
      variant("PLA", "Morado", 4.5, 1.2, 45),
      variant("PLA", "Turquesa", 4.5, 1.2, 45),
    ],
  },

  // ---------- Joyería y Complementos ----------
  {
    name: "Pendientes geométricos",
    slug: "pendientes-geometricos",
    categorySlug: "joyeria-y-complementos",
    status: "published",
    description:
      "Pendientes ligeros de resina con diseño geométrico. Incluyen cierre de presión o gancho " +
      "de plata de ley. No recomendados para uso continuado en piel sensible.",
    images: [photo("Pendientes geométricos"), photo("Pendientes geométricos - detalle")],
    variants: [
      variant("Resin", "Negro", 6.9, 2.1, 120),
      variant("Resin", "Rosa", 6.9, 2.1, 120),
      variant("Resin", "Blanco", 7.5, 2.4, 130),
    ],
  },
  {
    name: "Colgante con nombre",
    slug: "colgante-con-nombre",
    categorySlug: "joyeria-y-complementos",
    status: "published",
    description:
      "Colgante flexible en TPU con el nombre que elijas. Muy resistente al agua y ligero. " +
      "Se entrega con cordón ajustable de 45 cm.",
    images: [photo("Colgante con nombre")],
    variants: [
      variant("TPU", "Rosa", 8.5, 2.6, 110),
      variant("TPU", "Azul", 8.5, 2.6, 110),
    ],
  },

  // ---------- Arte y Diseño ----------
  {
    name: "Jarrón espiral",
    slug: "jarron-espiral",
    categorySlug: "arte-y-diseno",
    status: "published",
    description:
      "Jarrón de espiral continua de 20 cm, impreso en una sola pasada sin soportes. " +
      "Apto para flores secas; no es impermeable por las juntas del modelo.",
    images: [photo("Jarrón espiral"), photo("Jarrón espiral - vista lateral")],
    variants: [
      variant("PLA", "Blanco", 27.5, 9.0, 600),
      variant("PETG", "Azul", 29.9, 9.8, 660),
    ],
  },
  {
    name: "Escultura abstracta",
    slug: "escultura-abstracta",
    categorySlug: "arte-y-diseno",
    status: "published",
    description:
      "Escultura de formas orgánicas pensada para estanterías y mesas de centro. " +
      "Impresa en resina de alta precisión con altura aproximada de 25 cm.",
    images: [photo("Escultura abstracta")],
    variants: [
      variant("Resin", "Gris", 49.9, 18.0, 1200),
      variant("Resin", "Negro", 52.0, 18.6, 1260),
    ],
  },
  {
    name: "Reloj de pared hexagonal",
    slug: "reloj-de-pared-hexagonal",
    categorySlug: "arte-y-diseno",
    status: "published",
    description:
      "Reloj de pared de 30 cm con marcadores geométricos. Admite mecanismo de cuarzo estándar " +
      "(no incluido). Diseño limpio para cualquier estancia.",
    images: [photo("Reloj de pared hexagonal"), photo("Reloj de pared - detalle")],
    variants: [
      variant("PLA", "Negro", 32.9, 11.5, 780),
      variant("PLA", "Blanco", 32.9, 11.5, 780),
    ],
  },

  // ---------- Casos de prueba: no visibles en la tienda ----------
  {
    name: "Prototipo retirado",
    slug: "prototipo-retirado",
    categorySlug: "figuras-y-coleccionables",
    status: "published",
    isActive: false,
    description: "Impresión desactivada temporalmente por el equipo. No debe aparecer en la tienda.",
    images: [photo("Prototipo retirado")],
    variants: [variant("PLA", "Gris", 10.0, 3.5, 200)],
  },
  {
    name: "Pieza en revisión",
    slug: "pieza-en-revision",
    categorySlug: "arte-y-diseno",
    status: "draft",
    description: "Pieza en borrador: todavía no se ha publicado.",
    images: [],
    variants: [variant("PETG", "Azul", 19.0, 6.0, 300)],
  },
];

/** Usuarios de prueba: no se modifican. */
const adminAccount = {
  email: "admin@fusions3d.local",
  username: "admin",
  password: "Admin-Fusions3D-2026!",
  name: "Administrador Fusions3D",
};

const sampleUsers = [
  {
    email: "usuario1@fusions3d.local",
    username: "usuario1",
    password: "Usuario1-Fusions3D-2026!",
    name: "Usuario Uno",
    phone: "+34 600 000 001",
    addresses: [
      { street: "Calle Mayor 1", city: "Madrid", state: "Madrid", postalCode: "28001", country: "España", isDefault: true },
    ],
  },
  {
    email: "usuario2@fusions3d.local",
    username: "usuario2",
    password: "Usuario2-Fusions3D-2026!",
    name: "Usuario Dos",
    phone: "+34 600 000 002",
    addresses: [
      { street: "Avenida del Puerto 12", city: "Valencia", state: "Valencia", postalCode: "46021", country: "España", isDefault: true },
    ],
  },
];

async function upsert(Model, filter, values) {
  return Model.findOneAndUpdate(
    filter,
    { $set: values },
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
  );
}

async function ensureProfile(userId, profile) {
  await Profile.updateOne(
    { userId },
    { $setOnInsert: { userId, ...profile } },
    { upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );
}

async function seedRoles() {
  const roleIdByName = {};
  for (const role of roles) {
    const saved = await upsert(Role, { name: role.name }, role);
    roleIdByName[role.name] = saved._id;
  }
  console.log(`${roles.length} roles preparados.`);
  return roleIdByName;
}

async function ensureUser({ email, username, password, roleId, profile }) {
  const existing = await User.findOne({ email }).select("+passwordHash").lean();

  if (existing) {
    if (!existing.passwordHash || String(existing.role) !== String(roleId)) {
      throw new Error(`La cuenta ${email} ya existe con otro rol; limpia solo la base de pruebas y vuelve a sembrar`);
    }
    console.log(`Se conserva la cuenta existente (${email}); el seed no cambia su contraseña.`);
    if (!existing.username) {
      await User.updateOne({ _id: existing._id }, { $set: { username } });
    }
    await ensureProfile(existing._id, profile);
    return;
  }

  const user = await User.create({ email, username, passwordHash: await hashPassword(password), role: roleId });

  try {
    await ensureProfile(user._id, profile);
  } catch (error) {
    await User.deleteOne({ _id: user._id });
    throw error;
  }

  console.log(`Cuenta creada (${email}).`);
}

async function seedCatalog() {
  const materialByName = {};
  for (const material of materials) {
    const saved = await upsert(Material, { name: material.name }, material);
    materialByName[material.name] = saved._id;
  }
  console.log(`${materials.length} materiales preparados.`);

  const categoryBySlug = {};
  for (const category of categories) {
    const saved = await upsert(Category, { slug: category.slug }, category);
    categoryBySlug[category.slug] = saved._id;
  }
  console.log(`${categories.length} categorías preparadas.`);

  const printBySlug = {};
  for (const print of printData) {
    const { categorySlug, images: _images, variants: _variants, isActive = true, ...data } = print;
    const saved = await upsert(Print, { slug: print.slug }, {
      ...data,
      categoryId: categoryBySlug[categorySlug],
      isActive,
      deletedAt: null,
    });
    printBySlug[print.slug] = saved._id;
  }
  console.log(`${printData.length} impresiones preparadas.`);

  const usedSkus = new Set();
  const reserveSku = (base) => {
    let sku = base;
    let counter = 2;
    while (usedSkus.has(sku)) {
      sku = `${base}-${counter}`;
      counter++;
    }
    usedSkus.add(sku);
    return sku;
  };

  let variantCount = 0;
  for (const print of printData) {
    for (const item of print.variants) {
      const sku = reserveSku(buildSkuBase(print.name, item.material, item.color));

      await upsert(PrintVariant, {
        printId: printBySlug[print.slug],
        materialId: materialByName[item.material],
        color: item.color,
      }, {
        printId: printBySlug[print.slug],
        materialId: materialByName[item.material],
        sku,
        color: item.color,
        colorSlug: toSlug(item.color),
        colorHex: COLORS[item.color] ?? null,
        salePrice: item.salePrice,
        costPrice: item.costPrice,
        printTime: item.printTime,
        isActive: item.isActive,
        deletedAt: null,
      });
      variantCount++;
    }
  }
  console.log(`${variantCount} variantes preparadas.`);

  const imageOwners = [
    ...categories.map((category) => ({
      entityType: "Category",
      entityId: categoryBySlug[category.slug],
      label: category.name,
      imageUrls: [picsum(`categoria-${category.slug}`)],
    })),
    ...printData.map((print) => ({
      entityType: "Print",
      entityId: printBySlug[print.slug],
      label: print.name,
      imageUrls: gallery(print),
    })),
  ];

  let imageCount = 0;
  for (const owner of imageOwners) {
    await Image.deleteMany({ entityType: owner.entityType, entityId: owner.entityId });

    const images = owner.imageUrls.map((imageUrl, position) => ({
      entityType: owner.entityType,
      entityId: owner.entityId,
      imageUrl,
      altText: owner.label,
      position,
      isCover: position === 0,
      status: "published",
      isActive: true,
    }));

    if (images.length > 0) await Image.insertMany(images);
    imageCount += images.length;
  }
  console.log(`${imageCount} imágenes de ejemplo preparadas.`);
}

async function seed({ reset = false } = {}) {
  try {
    if (process.env.NODE_ENV?.toLowerCase() === "production") {
      throw new Error("El seed está bloqueado con NODE_ENV=production");
    }

    if (reset && !process.argv.includes("--confirm-reset")) {
      throw new Error("Para confirmar el borrado, ejecuta el comando npm run seed:reset");
    }

    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI no está definida en el archivo .env");
    }

    await mongoose.connect(process.env.MONGODB_URI, { autoIndex: false, autoCreate: false });
    console.log(`Conectado a MongoDB (${mongoose.connection.name}).`);

    if (reset) {
      console.warn("Modo destructivo: vaciando las colecciones de Fusions3D antes de sembrar…");
      const collections = [Category, Material, Print, PrintVariant, Role, Image, User, Profile, RevokedToken];
      const deleteResults = await Promise.all(collections.map((Model) => Model.deleteMany({})));
      const deletedCount = deleteResults.reduce((total, result) => total + result.deletedCount, 0);
      console.log(`${deletedCount} documentos eliminados de ${collections.length} colecciones.`);
    } else {
      console.log("Insertando/actualizando datos de ejemplo sin borrar datos existentes…");
    }

    const roleIdByName = await seedRoles();
    await seedCatalog();

    await ensureUser({
      email: adminAccount.email,
      username: adminAccount.username,
      password: adminAccount.password,
      roleId: roleIdByName.ADMIN,
      profile: { name: adminAccount.name, addresses: [] },
    });

    for (const user of sampleUsers) {
      await ensureUser({
        email: user.email,
        username: user.username,
        password: user.password,
        roleId: roleIdByName.USER,
        profile: { name: user.name, phone: user.phone, addresses: user.addresses },
      });
    }

    console.log(`Cuentas preparadas: 1 administrador (${adminAccount.email}) y ${sampleUsers.length} usuarios de prueba.`);
    console.log(reset
      ? "Seed completado. Se recrearon los datos de prueba en las colecciones de Fusions3D."
      : "Seed completado. No se han eliminado datos existentes.");
  } catch (error) {
    console.error("Error ejecutando el seed:", error);
    process.exitCode = 1;
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      console.log("Conexión a MongoDB cerrada.");
    }
  }
}

seed({ reset: process.argv.includes("--reset") });
