require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Category = require("./src/models/category.model");
const Material = require("./src/models/material.model");
const Print = require("./src/models/print.model");
const PrintVariant = require("./src/models/printVariant.model");
const Role = require("./src/models/role.model");
const User = require("./src/models/user.model");
const Image = require("./src/models/image.model");

const materials = ["PLA", "PETG", "ABS", "TPU", "Resin"].map((name) => ({ name, isActive: true, deletedAt: null }));

const categories = [
  { name: "Accesorios y Escritorio", slug: "accesorios-y-escritorio" },
  { name: "Hogar y Decoración", slug: "hogar-y-decoracion" },
  { name: "Figuras y Coleccionables", slug: "figuras-y-coleccionables" },
  { name: "Electrónica y Maker", slug: "electronica-y-maker" },
].map((category) => ({ ...category, status: "published", isActive: true, deletedAt: null }));

const roles = ["admin", "gestor", "cliente"].map((name) => ({ name, isActive: true, deletedAt: null }));

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
  { printSlug: "soporte-para-movil", sku: "SOPMOV-PLA-NEG", name: "Estándar - PLA Negro", materialName: "PLA", color: "Negro", salePrice: 12.5, costPrice: 4.2, printTime: 180 },
  { printSlug: "soporte-para-movil", sku: "SOPMOV-PET-AZU", name: "Resistente - PETG Azul", materialName: "PETG", color: "Azul", salePrice: 15.9, costPrice: 5.3, printTime: 210 },
  { printSlug: "maceta-geometrica", sku: "MACGEO-PETG-BLA", name: "Estándar - PETG Blanco", materialName: "PETG", color: "Blanco", salePrice: 18.9, costPrice: 6.75, printTime: 360 },
  { printSlug: "organizador-de-cables", sku: "ORGCAB-PLA-GRI", name: "Estándar - PLA Gris", materialName: "PLA", color: "Gris", salePrice: 8.5, costPrice: 2.3, printTime: 120 },
  { printSlug: "figura-decorativa", sku: "FIGDEC-RES-GRI", name: "Estándar - Resin Gris", materialName: "Resin", color: "Gris", salePrice: 24.9, costPrice: 9.8, printTime: 540 },
  { printSlug: "caja-para-electronica", sku: "CAJELE-ABS-NEG", name: "Estándar - ABS Negro", materialName: "ABS", color: "Negro", salePrice: 16.75, costPrice: 5.6, printTime: 300 },
].map((variant) => ({ ...variant, isActive: true, deletedAt: null }));

const userData = [
  {
    name: "Administrador Fusions3D",
    email: "admin@fusions3d.local",
    password: process.env.SEED_ADMIN_PASSWORD || "Admin123!",
    roles: ["admin"],
    phone: "+34 600 000 001",
    addresses: [{ street: "Calle Mayor 1", city: "Madrid", state: "Madrid", postalCode: "28001", country: "España", isDefault: true }],
  },
  {
    name: "Gestor Fusions3D",
    email: "gestor@fusions3d.local",
    password: "Gestor123!",
    roles: ["gestor"],
    phone: "+34 600 000 004",
    addresses: [{ street: "Calle de Alcalá 10", city: "Madrid", state: "Madrid", postalCode: "28014", country: "España", isDefault: true }],
  },
  {
    name: "María García",
    email: "maria@example.com",
    password: "Cliente123!",
    roles: ["cliente"],
    phone: "+34 600 000 002",
    addresses: [{ street: "Calle del Sol 24", city: "Valencia", state: "Valencia", postalCode: "46001", country: "España", isDefault: true }],
  },
  {
    name: "Carlos López",
    email: "carlos@example.com",
    password: "Cliente123!",
    roles: ["cliente"],
    phone: "+34 600 000 003",
    addresses: [{ street: "Avenida Andalucía 18", city: "Sevilla", state: "Sevilla", postalCode: "41001", country: "España", isDefault: true }],
  },
];

async function upsert(Model, filter, values) {
  return Model.findOneAndUpdate(
    filter,
    { $set: values },
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
  );
}

async function seed() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI no está definida en el archivo .env");
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Conectado a MongoDB. Insertando/actualizando datos de ejemplo…");

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

    const roleByName = {};
    for (const role of roles) {
      const saved = await upsert(Role, { name: role.name }, role);
      roleByName[role.name] = saved._id;
    }
    console.log(`${roles.length} roles preparados.`);

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

    const variantBySku = {};
    for (const variant of variantData) {
      const saved = await upsert(PrintVariant, { sku: variant.sku }, {
        printId: printBySlug[variant.printSlug],
        materialId: materialByName[variant.materialName],
        sku: variant.sku,
        name: variant.name,
        color: variant.color,
        salePrice: variant.salePrice,
        costPrice: variant.costPrice,
        printTime: variant.printTime,
        isActive: variant.isActive,
        deletedAt: variant.deletedAt,
      });
      variantBySku[variant.sku] = saved._id;
    }
    console.log(`${variantData.length} variantes preparadas.`);

    const passwordByValue = new Map();
    for (const user of userData) {
      let passwordHash = passwordByValue.get(user.password);
      if (!passwordHash) {
        passwordHash = await bcrypt.hash(user.password, 10);
        passwordByValue.set(user.password, passwordHash);
      }

      const { password, roles: roleNames, ...data } = user;
      await User.findOneAndUpdate(
        { email: user.email },
        {
          $set: {
            ...data,
            roles: roleNames.map((roleName) => roleByName[roleName]),
            isActive: true,
            deletedAt: null,
          },
          $setOnInsert: { password: passwordHash, createdAt: new Date(), updatedAt: null },
        },
        { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
      );
    }
    console.log(`${userData.length} usuarios preparados (contraseñas guardadas con bcrypt).`);

    const imageRecords = [
      ...categories.map((category, index) => ({
        entityType: "Category",
        entityId: categoryBySlug[category.slug],
        label: category.name,
        position: index,
      })),
      ...printData.map((print, index) => ({
        entityType: "Print",
        entityId: printBySlug[print.slug],
        label: print.name,
        imageUrl: print.imageUrl,
        position: index,
      })),
    ];

    for (const variant of variantData) {
      await Image.deleteOne({
        entityType: "PrintVariant",
        entityId: variantBySku[variant.sku],
        imageUrl: `https://placehold.co/800x600/ff6000/ffffff?text=${encodeURIComponent(variant.name)}`,
      });
    }

    for (const image of imageRecords) {
      const imageUrl = image.imageUrl || `https://placehold.co/800x600/ff6000/ffffff?text=${encodeURIComponent(image.label)}`;

      // Si el seed antiguo creó un placeholder para este print, lo desmarca
      // como portada para que la nueva foto sea la que muestre el frontend.
      if (image.entityType === "Print" && image.imageUrl) {
        const oldPlaceholderUrl = `https://placehold.co/800x600/ff6000/ffffff?text=${encodeURIComponent(image.label)}`;
        await Image.updateOne(
          { entityType: "Print", entityId: image.entityId, imageUrl: oldPlaceholderUrl },
          { $set: { isCover: false, isActive: false, status: "archived" } }
        );
      }

      await Image.findOneAndUpdate(
        { entityType: image.entityType, entityId: image.entityId, imageUrl },
        {
          $set: {
            entityType: image.entityType,
            entityId: image.entityId,
            imageUrl,
            altText: image.label,
            position: image.position,
            isCover: true,
            status: "published",
            isActive: true,
          },
        },
        { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
      );
    }
    console.log(`${imageRecords.length} imágenes de ejemplo preparadas.`);
    console.log("Seed completado. No se han eliminado datos existentes.");
    console.log("Usuario admin de desarrollo: admin@fusions3d.local");
    if (!process.env.SEED_ADMIN_PASSWORD) {
      console.warn("Contraseña inicial del admin: Admin123! (cámbiala y define SEED_ADMIN_PASSWORD).");
    }
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

seed();
