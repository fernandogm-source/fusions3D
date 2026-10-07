require("dotenv").config();

const mongoose = require("mongoose");
const Print = require("./src/modules/print/print.model");

const prints = [
  {
    nombre: "Soporte para móvil",
    descripcion:
      "Soporte de escritorio para teléfono móvil, optimizado para impresión 3D.",
    precio_venta: 12.5,
    precio_coste: 4.2,
    tiempo_impresion: 180,
    isActive: true,
    status: "published",
    slug: "soporte-para-movil",
  },
  {
    nombre: "Maceta geométrica",
    descripcion:
      "Maceta decorativa con diseño geométrico y drenaje inferior.",
    precio_venta: 18.9,
    precio_coste: 6.75,
    tiempo_impresion: 360,
    isActive: true,
    status: "published",
    slug: "maceta-geometrica",
  },
  {
    nombre: "Organizador de cables",
    descripcion:
      "Organizador compacto para mantener ordenados cables de escritorio.",
    precio_venta: 8.5,
    precio_coste: 2.3,
    tiempo_impresion: 120,
    isActive: true,
    status: "draft",
    slug: "organizador-de-cables",
  },
  {
    nombre: "Figura decorativa",
    descripcion:
      "Figura decorativa de sobremesa con acabado pensado para impresión FDM.",
    precio_venta: 24.9,
    precio_coste: 9.8,
    tiempo_impresion: 540,
    isActive: true,
    status: "published",
    slug: "figura-decorativa",
  },
  {
    nombre: "Caja para electrónica",
    descripcion:
      "Caja modular para pequeños proyectos electrónicos y placas de desarrollo.",
    precio_venta: 16.75,
    precio_coste: 5.6,
    tiempo_impresion: 300,
    isActive: true,
    status: "archived",
    slug: "caja-para-electronica",
  },
];

async function seed() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error(
        "MONGODB_URI no está definida en el archivo .env"
      );
    }

    await mongoose.connect(process.env.MONGODB_URI);

    console.log("Conectado a MongoDB.");

    // Limpiamos las impresiones existentes
    await Print.deleteMany({});

    console.log("Colección de impresiones limpiada.");

    // Insertamos los datos de prueba
    await Print.insertMany(prints);

    console.log(
      `${prints.length} impresiones insertadas correctamente.`
    );
  } catch (error) {
    console.error("Error ejecutando el seed:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log("Conexión a MongoDB cerrada.");
  }
}

seed();
