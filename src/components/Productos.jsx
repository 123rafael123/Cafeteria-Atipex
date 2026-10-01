// src/components/Productos.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

// ============================================================================
// 1. CONFIGURACIÓN DE SUPABASE
// ============================================================================

/**
 * Cliente de Supabase inicializado con variables de entorno.
 * @type {import('@supabase/supabase-js').SupabaseClient}
 */
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// ============================================================================
// 2. FUNCIONES AUXILIARES (lógica de negocio y utilidades)
// ============================================================================

/**
 * Obtiene los productos activos con stock > 0 desde Supabase.
 * Incluye la relación con categorias para poder filtrar por categoría.
 * @returns {Promise<Array>} Lista de productos.
 * @throws {Error} Si la consulta falla.
 */
const obtenerProductos = async () => {
  const { data, error } = await supabase
    .from('productos')
    .select('id, nombre, precio, imagen_url, categoria_id, categorias(nombre)')
    .eq('activo', true)
    .gt('stock', 0);

  if (error) throw new Error(`Error al obtener productos: ${error.message}`);
  return data || [];
};

const CATEGORIA_TODAS = 'todas';

// ============================================================================
// 3. COMPONENTE PRINCIPAL
// ============================================================================

/**
 * Componente que muestra una lista de productos en forma de tarjetas.
 * Obtiene los datos de Supabase al montarse y los renderiza en una cuadrícula.
 * Permite filtrar el catálogo por categoría mediante un selector.
 * @returns {JSX.Element} Sección de productos.
 */
const Productos = () => {
  const [productos, setProductos] = useState([]);
  const [categoriaActiva, setCategoriaActiva] = useState(CATEGORIA_TODAS);
  const [cargando, setCargando] = useState(true);

  // Cargar productos al montar el componente
  useEffect(() => {
    const cargarProductos = async () => {
      try {
        const data = await obtenerProductos();
        setProductos(data);
      } catch (err) {
        console.error('Error al obtener productos:', err);
      } finally {
        setCargando(false);
      }
    };
    cargarProductos();
  }, []);

  // Extraer las categorías disponibles, sin duplicados y en orden alfabético
  const categorias = useMemo(() => {
    const nombres = productos
      .map((prod) => prod.categorias?.nombre)
      .filter(Boolean);
    return [...new Set(nombres)].sort((a, b) => a.localeCompare(b, 'es'));
  }, [productos]);

  // Filtrar el catálogo según la categoría seleccionada
  const productosFiltrados = useMemo(() => {
    if (categoriaActiva === CATEGORIA_TODAS) return productos;
    return productos.filter((prod) => prod.categorias?.nombre === categoriaActiva);
  }, [productos, categoriaActiva]);

  // ==========================================================================
  // RENDERIZADO
  // ==========================================================================

  // Estilos en línea (se mantienen igual que en el original, pero separados para claridad)
  const containerStyle = { padding: '2rem' };
  const gridStyle = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '1rem',
  };
  const cardStyle = {
    border: '1px solid #ccc',
    borderRadius: '8px',
    padding: '1rem',
    width: '200px',
  };
  const imageStyle = {
    width: '100%',
    height: '150px',
    objectFit: 'cover',
  };
  const filtroStyle = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem',
    marginBottom: '1rem',
  };
  const botonFiltroStyle = (activo) => ({
    padding: '0.4rem 0.9rem',
    borderRadius: '999px',
    border: `1px solid ${activo ? '#27ae60' : '#ccc'}`,
    background: activo ? '#27ae60' : '#fff',
    color: activo ? '#fff' : '#333',
    cursor: 'pointer',
  });

  return (
    <div style={containerStyle}>
      <h2>Lista de Productos</h2>

      {categorias.length > 1 && (
        <div style={filtroStyle} role="group" aria-label="Filtrar por categoría">
          <button
            type="button"
            style={botonFiltroStyle(categoriaActiva === CATEGORIA_TODAS)}
            onClick={() => setCategoriaActiva(CATEGORIA_TODAS)}
          >
            Todas
          </button>
          {categorias.map((nombre) => (
            <button
              type="button"
              key={nombre}
              style={botonFiltroStyle(categoriaActiva === nombre)}
              onClick={() => setCategoriaActiva(nombre)}
            >
              {nombre}
            </button>
          ))}
        </div>
      )}

      {cargando ? (
        <p>Cargando productos...</p>
      ) : productosFiltrados.length === 0 ? (
        <p>No hay productos disponibles en esta categoría.</p>
      ) : (
        <div style={gridStyle}>
          {productosFiltrados.map((prod) => (
            <div key={prod.id} style={cardStyle}>
              <img
                src={prod.imagen_url || '/default-product.png'}
                alt={prod.nombre}
                style={imageStyle}
              />
              <h4>{prod.nombre}</h4>
              {prod.categorias?.nombre && (
                <p style={{ fontSize: '0.85rem', color: '#666', margin: '0 0 0.25rem' }}>
                  {prod.categorias.nombre}
                </p>
              )}
              <p>
                <strong>Bs. {Number(prod.precio || 0).toFixed(2)}</strong>
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Productos;