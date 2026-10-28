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

const roles = ["ADMIN", "USER"].map((name) => ({ name, isActive: true, deletedAt: null }));

const materials = ["PLA", "PETG", "ABS", "TPU", "Resin"].map((name) => ({ name, isActive: true, deletedAt: null }));

const categories = [
  { name: "Accesorios y Escritorio", slug: "accesorios-y-escritorio" },
  { name: "Hogar y Decoración", slug: "hogar-y-decoracion" },
  { name: "Figuras y Coleccionables", slug: "figuras-y-coleccionables" },
  { name: "Electrónica y Maker", slug: "electronica-y-maker" },
].map((category) => ({ ...category, status: "published", isActive: true, deletedAt: null }));

const printData = [
  {
    name: "Soporte para móvil",
    description: "Soporte de escritorio para teléfono móvil, optimizado para impresión 3D.",
    categorySlug: "accesorios-y-escritorio",
    status: "published",
    slug: "soporte-para-movil",
    imageUrl: "https://images.pexels.com/photos/29148783/pexels-photo-29148783.jpeg?auto=compress&cs=tinysrgb&w=900",
  },
  {
    name: "Maceta geométrica",
    description: "Maceta decorativa con diseño geométrico y drenaje inferior.",
    categorySlug: "hogar-y-decoracion",
    status: "published",
    slug: "maceta-geometrica",
    imageUrl: "https://images.pexels.com/photos/7222203/pexels-photo-7222203.jpeg?auto=compress&cs=tinysrgb&w=900",
  },
  {
    name: "Organizador de cables",
    description: "Organizador compacto para mantener ordenados cables de escritorio.",
    categorySlug: "accesorios-y-escritorio",
    status: "draft",
    slug: "organizador-de-cables",
    imageUrl: "https://images.pexels.com/photos/19583534/pexels-photo-19583534.jpeg?auto=compress&cs=tinysrgb&w=900",
  },
  {
    name: "Figura decorativa",
    description: "Figura decorativa de sobremesa con acabado pensado para impresión FDM.",
    categorySlug: "figuras-y-coleccionables",
    status: "published",
    slug: "figura-decorativa",
    imageUrl: "https://images.pexels.com/photos/14158951/pexels-photo-14158951.jpeg?auto=compress&cs=tinysrgb&w=900",
  },
  {
    name: "Caja para electrónica",
    description: "Caja modular para pequeños proyectos electrónicos y placas de desarrollo.",
    categorySlug: "electronica-y-maker",
    status: "archived",
    slug: "caja-para-electronica",
    imageUrl: "https://images.pexels.com/photos/20341728/pexels-photo-20341728.jpeg?auto=compress&cs=tinysrgb&w=900",
  },
];

const variantData = [
  { printSlug: "soporte-para-movil", materialName: "PLA", color: "Negro", salePrice: 12.5, costPrice: 4.2, printTime: 180 },
  { printSlug: "soporte-para-movil", materialName: "PETG", color: "Azul", salePrice: 15.9, costPrice: 5.3, printTime: 210 },
  { printSlug: "maceta-geometrica", materialName: "PETG", color: "Blanco", salePrice: 18.9, costPrice: 6.75, printTime: 360 },
  { printSlug: "organizador-de-cables", materialName: "PLA", color: "Gris", salePrice: 8.5, costPrice: 2.3, printTime: 120 },
  { printSlug: "figura-decorativa", materialName: "Resin", color: "Gris", salePrice: 24.9, costPrice: 9.8, printTime: 540 },
  { printSlug: "caja-para-electronica", materialName: "ABS", color: "Negro", salePrice: 16.75, costPrice: 5.6, printTime: 300 },
].map((variant) => ({ ...variant, isActive: true, deletedAt: null }));

const adminAccount = {
  email: "admin@fusions3d.local",
  password: "Admin-Fusions3D-2026!",
  name: "Administrador Fusions3D",
};

const sampleUsers = [
  {
    email: "usuario1@fusions3d.local",
    password: "Usuario1-Fusions3D-2026!",
    name: "Usuario Uno",
    phone: "+34 600 000 001",
    addresses: [
      { street: "Calle Mayor 1", city: "Madrid", state: "Madrid", postalCode: "28001", country: "España", isDefault: true },
    ],
  },
  {
    email: "usuario2@fusions3d.local",
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

async function ensureUser({ email, password, roleId, profile }) {
  const existing = await User.findOne({ email }).select("+passwordHash").lean();

  if (existing) {
    if (!existing.passwordHash || String(existing.role) !== String(roleId)) {
      throw new Error(`La cuenta ${email} ya existe con otro rol; limpia solo la base de pruebas y vuelve a sembrar`);
    }
    console.log(`Se conserva la cuenta existente (${email}); el seed no cambia su contraseña.`);
    await ensureProfile(existing._id, profile);
    return;
  }

  const user = await User.create({ email, passwordHash: await hashPassword(password), role: roleId });

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
    const { categorySlug, imageUrl: _imageUrl, ...data } = print;
    const saved = await upsert(Print, { slug: print.slug }, {
      ...data,
      categoryId: categoryBySlug[categorySlug],
      isActive: true,
      deletedAt: null,
    });
    printBySlug[print.slug] = saved._id;
  }
  console.log(`${printData.length} impresiones preparadas.`);

  const printByName = Object.fromEntries(printData.map((print) => [print.slug, print.name]));

  for (const variant of variantData) {
    const sku = buildSkuBase(printByName[variant.printSlug], variant.materialName, variant.color);

    await upsert(PrintVariant, {
      printId: printBySlug[variant.printSlug],
      materialId: materialByName[variant.materialName],
      color: variant.color,
    }, {
      printId: printBySlug[variant.printSlug],
      materialId: materialByName[variant.materialName],
      sku,
      color: variant.color,
      salePrice: variant.salePrice,
      costPrice: variant.costPrice,
      printTime: variant.printTime,
      isActive: variant.isActive,
      deletedAt: variant.deletedAt,
    });
  }
  console.log(`${variantData.length} variantes preparadas.`);

  const imageOwners = [
    ...categories.map((category) => ({
      entityType: "Category",
      entityId: categoryBySlug[category.slug],
      label: category.name,
      imageUrls: [`https://placehold.co/800x600/ff6000/ffffff?text=${encodeURIComponent(category.name)}`],
    })),
    ...printData.map((print) => ({
      entityType: "Print",
      entityId: printBySlug[print.slug],
      label: print.name,
      imageUrls: [print.imageUrl],
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

    await Image.insertMany(images);
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
      password: adminAccount.password,
      roleId: roleIdByName.ADMIN,
      profile: { name: adminAccount.name, addresses: [] },
    });

    for (const user of sampleUsers) {
      await ensureUser({
        email: user.email,
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
