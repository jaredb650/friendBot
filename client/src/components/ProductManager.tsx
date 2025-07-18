import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import './ProductManager.css';

interface Product {
  id: number;
  name: string;
  description: string;
  pay_per_mention: number;
  is_active: boolean;
  created_at: string;
}

const ProductManager: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const { token } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    payPerMention: '',
    isActive: true
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get('/api/admin/products', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      payPerMention: '',
      isActive: true
    });
    setEditingProduct(null);
    setShowAddForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        payPerMention: parseFloat(formData.payPerMention),
        isActive: formData.isActive
      };

      if (editingProduct) {
        await axios.put(`/api/admin/products/${editingProduct.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMessage('Product updated successfully!');
      } else {
        await axios.post('/api/admin/products', payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMessage('Product added successfully!');
      }

      setIsSuccess(true);
      resetForm();
      fetchProducts();
    } catch (error) {
      setMessage('Failed to save product. Please try again.');
      setIsSuccess(false);
    }

    setIsLoading(false);
    setTimeout(() => setMessage(''), 3000);
  };

  const editProduct = (product: Product) => {
    setFormData({
      name: product.name,
      description: product.description,
      payPerMention: product.pay_per_mention.toString(),
      isActive: product.is_active
    });
    setEditingProduct(product);
    setShowAddForm(true);
  };

  const toggleProductStatus = async (product: Product) => {
    const newStatus = !product.is_active;
    const action = newStatus ? 'activated' : 'deactivated';
    
    console.log('📝 Frontend: Starting product status toggle for:', { 
      productId: product.id, 
      productName: product.name, 
      currentStatus: product.is_active, 
      newStatus 
    });
    
    try {
      const url = `/api/admin/products/${product.id}`;
      const payload = {
        name: product.name,
        description: product.description,
        payPerMention: product.pay_per_mention,
        isActive: newStatus
      };
      
      console.log('📝 Frontend: Making PUT request to:', url);
      console.log('📝 Frontend: With payload:', payload);
      console.log('📝 Frontend: With token:', token ? 'Present' : 'Missing');
      
      const response = await axios.put(url, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('✅ Frontend: Update response:', response.data);
      setMessage(`Product campaign ${action} successfully!`);
      setIsSuccess(true);
      fetchProducts();
    } catch (error: any) {
      console.error('❌ Frontend: Update error:', error);
      console.error('❌ Frontend: Error response:', error.response?.data);
      console.error('❌ Frontend: Error status:', error.response?.status);
      console.error('❌ Frontend: Error message:', error.message);
      
      // Try to extract meaningful error message
      let errorMessage = 'Unknown error';
      if (error.response?.data) {
        if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        } else if (error.response.data.error) {
          errorMessage = error.response.data.error;
        } else if (error.response.data.details) {
          errorMessage = error.response.data.details;
        } else {
          errorMessage = JSON.stringify(error.response.data);
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      console.log('❌ Frontend: Processed error message:', errorMessage);
      setMessage(`Failed to ${newStatus ? 'activate' : 'deactivate'} product campaign: ${errorMessage}`);
      setIsSuccess(false);
    }

    setTimeout(() => setMessage(''), 5000);
  };

  const deleteProduct = async (id: number, productName: string) => {
    if (!window.confirm(`Are you sure you want to PERMANENTLY DELETE "${productName}" and ALL its analytics data? This action cannot be undone.`)) return;

    console.log('🗑️ Frontend: Starting product deletion for:', { id, productName });
    
    try {
      console.log('🗑️ Frontend: Making DELETE request to:', `/api/admin/products/${id}`);
      console.log('🗑️ Frontend: With token:', token ? 'Present' : 'Missing');
      
      const response = await axios.delete(`/api/admin/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('✅ Frontend: Delete response:', response.data);
      setMessage(`Product "${productName}" and analytics data deleted successfully!`);
      setIsSuccess(true);
      fetchProducts();
    } catch (error: any) {
      console.error('❌ Frontend: Delete error:', error);
      console.error('❌ Frontend: Error response:', error.response?.data);
      console.error('❌ Frontend: Error status:', error.response?.status);
      console.error('❌ Frontend: Error message:', error.message);
      
      const errorMessage = error.response?.data?.error || error.response?.data?.details || error.message || 'Unknown error';
      setMessage(`Failed to delete product: ${errorMessage}`);
      setIsSuccess(false);
    }

    setTimeout(() => setMessage(''), 5000); // Longer timeout to read error details
  };

  const predefinedProducts = [
    {
      name: "MegaCorp Energy Drink",
      description: "The energy drink that powers through your day! Now with 200% more caffeine!",
      payPerMention: 0.75
    },
    {
      name: "SuperSoft Toilet Paper",
      description: "The softest toilet paper money can buy. Your bottom deserves the best!",
      payPerMention: 0.50
    },
    {
      name: "FlexFit Pro Exercise Equipment",
      description: "Get ripped in just 30 days with our revolutionary workout system!",
      payPerMention: 2.00
    },
    {
      name: "GlowUp Beauty Serum",
      description: "Look 10 years younger with our patented anti-aging formula!",
      payPerMention: 1.25
    },
    {
      name: "TechWiz Smart Home Device",
      description: "Control your entire home with voice commands! The future is now!",
      payPerMention: 1.50
    }
  ];

  const addPredefinedProduct = (product: any) => {
    setFormData({
      name: product.name,
      description: product.description,
      payPerMention: product.payPerMention.toString(),
      isActive: true
    });
    setShowAddForm(true);
  };

  return (
    <div className="admin-section">
      <h2>📦 Product Management</h2>
      <p className="section-description">
        Manage sponsored products that FriendBot will promote in conversations.
      </p>

      {message && (
        <div className={`message ${isSuccess ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      <div className="product-actions">
        <button
          onClick={() => setShowAddForm(true)}
          className="add-product-btn"
        >
          + Add New Product
        </button>
      </div>

      {!showAddForm && products.length === 0 && (
        <div className="quick-start">
          <h3>🚀 Quick Start - Add Sample Products:</h3>
          <div className="predefined-products">
            {predefinedProducts.map((product, index) => (
              <div key={index} className="predefined-product">
                <h4>{product.name}</h4>
                <p>{product.description}</p>
                <div className="product-pay">${product.payPerMention} per mention</div>
                <button
                  onClick={() => addPredefinedProduct(product)}
                  className="add-sample-btn"
                >
                  Add This Product
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {showAddForm && (
        <div className="product-form">
          <h3>{editingProduct ? 'Edit Product' : 'Add New Product'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Product Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
              />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows={3}
                required
              />
            </div>

            <div className="form-group">
              <label>Pay Per Mention ($)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.payPerMention}
                onChange={(e) => setFormData({...formData, payPerMention: e.target.value})}
                required
              />
            </div>

            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                />
                Active (will be promoted by FriendBot)
              </label>
            </div>

            <div className="form-actions">
              <button type="submit" disabled={isLoading} className="save-btn">
                {isLoading ? 'Saving...' : editingProduct ? 'Update Product' : 'Add Product'}
              </button>
              <button type="button" onClick={resetForm} className="cancel-btn">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {products.length > 0 && (
        <div className="products-list">
          <h3>Current Products</h3>
          <div className="products-grid">
            {products.map((product) => (
              <div key={product.id} className={`product-card ${!product.is_active ? 'inactive' : ''}`}>
                <div className="product-header">
                  <h4>{product.name}</h4>
                  <div className="product-status">
                    {product.is_active ? '✅ Active' : '⏸️ Inactive'}
                  </div>
                </div>
                <p className="product-description">{product.description}</p>
                <div className="product-pay">${product.pay_per_mention} per mention</div>
                <div className="product-actions">
                  <button onClick={() => editProduct(product)} className="edit-btn">
                    Edit
                  </button>
                  <button 
                    onClick={() => toggleProductStatus(product)} 
                    className={product.is_active ? "deactivate-btn" : "activate-btn"}
                  >
                    {product.is_active ? '⏸️ Deactivate Campaign' : '▶️ Activate Campaign'}
                  </button>
                  <button onClick={() => deleteProduct(product.id, product.name)} className="delete-btn">
                    🗑️ Delete Product + Analytics
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductManager;