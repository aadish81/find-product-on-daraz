"use client";

import { useState } from "react";

interface ProductData {
  name?: string;
  brand?: string;
  original_price?: number;
  discounted_price?: number;
  similarity?: number;
  same_product?: boolean;
  message?: string;
}

export default function Home() {
  const [formData, setFormData] = useState({
    productName: "",
    brandName: "",
    price: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [productData, setProductData] = useState<ProductData[] | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");
    setProductData(null);

    try {
      const response = await fetch(process.env.NEXT_PUBLIC_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        // API returns { "results": [...] } - take all elements from results array
        const productResult = result.results && Array.isArray(result.results) ? result.results : null;
        setProductData(productResult);
      } else {
        setMessage("Error submitting product. Please try again.");
      }
    } catch (error) {
      setMessage("Network error. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchNext = () => {
    setFormData({
      productName: "",
      brandName: "",
      price: ""
    });
    setProductData(null);
    setMessage("");
  };

  return (
    <div className="min-h-screen bg-zinc-50 font-sans dark:bg-black p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 text-black dark:text-zinc-50">
          Find Products on Daraz.com.np
        </h1>
        
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Side - Form */}
          <div className="bg-white dark:bg-black rounded-lg shadow-lg p-8">
            <h2 className="text-xl font-semibold mb-6 text-black dark:text-zinc-50">
              Search Product
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="productName" className="block text-sm font-medium mb-2 text-black dark:text-zinc-50">
                  Product Name
                </label>
                <input
                  type="text"
                  id="productName"
                  name="productName"
                  value={formData.productName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-black/8 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-white/20 dark:bg-zinc-900 dark:text-zinc-50"
                  placeholder="Enter product name"
                />
              </div>

              <div>
                <label htmlFor="brandName" className="block text-sm font-medium mb-2 text-black dark:text-zinc-50">
                  Brand Name
                </label>
                <input
                  type="text"
                  id="brandName"
                  name="brandName"
                  value={formData.brandName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-black/8 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-white/20 dark:bg-zinc-900 dark:text-zinc-50"
                  placeholder="Enter brand name"
                />
              </div>

              <div>
                <label htmlFor="price" className="block text-sm font-medium mb-2 text-black dark:text-zinc-50">
                  Price
                </label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  required
                  step="0.01"
                  min="0"
                  className="w-full px-4 py-2 border border-black/8 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-white/20 dark:bg-zinc-900 dark:text-zinc-50"
                  placeholder="Enter price"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Searching..." : "Search Product"}
              </button>
            </form>

            {message && (
              <div className={`mt-4 p-3 rounded-lg text-center ${
                message.includes("success") 
                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" 
                  : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
              }`}>
                {message}
              </div>
            )}
          </div>

          {/* Right Side - Results */}
          <div className="bg-white dark:bg-black rounded-lg shadow-lg p-8">
            <h2 className="text-xl font-semibold mb-6 text-black dark:text-zinc-50">
              Search Results
            </h2>

            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-black dark:text-zinc-50">Searching...</p>
                </div>
              </div>
            ) : productData && productData.length > 0 ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-black dark:text-zinc-50">
                    Found {productData.length} Product{productData.length > 1 ? 's' : ''}
                  </h3>
                </div>
                
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {productData.map((product, index) => (
                    <div key={index} className={`rounded-lg p-6 border ${
                      product.same_product 
                        ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                        : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                    }`}>
                      <div className="flex items-center mb-4">
                        <div className={`w-3 h-3 rounded-full mr-3 ${
                          product.same_product ? "bg-green-500" : "bg-red-500"
                        }`}></div>
                        <h4 className="text-base font-semibold text-black dark:text-zinc-50">
                          {product.same_product ? "Matching Product" : "No Match"}
                        </h4>
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Product Name</p>
                            <p className="text-base font-medium text-black dark:text-zinc-50">
                              {product.name || "N/A"}
                            </p>
                          </div>
                          
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Brand</p>
                            <p className="text-base font-medium text-black dark:text-zinc-50">
                              {product.brand || "N/A"}
                            </p>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Original Price</p>
                            <p className="text-base font-medium text-black dark:text-zinc-50">
                              Rs. {product.original_price?.toFixed(2) || "N/A"}
                            </p>
                          </div>
                          
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Discounted Price</p>
                            <p className="text-base font-medium text-green-600 dark:text-green-400">
                              Rs. {product.discounted_price?.toFixed(2) || "N/A"}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {product.similarity !== undefined && (
                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-gray-600 dark:text-gray-400">Similarity Score</p>
                            <div className="flex items-center">
                              <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-3">
                                <div 
                                  className="bg-green-500 h-2 rounded-full"
                                  style={{ width: `${(product.similarity || 0) * 100}%` }}
                                ></div>
                              </div>
                              <span className="text-sm font-medium text-black dark:text-zinc-50">
                                {((product.similarity || 0) * 100).toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {!product.same_product && product.message && (
                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            {product.message}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                
                {productData.some(product => !product.same_product) && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      <strong>Tip:</strong> Try searching with different keywords or check the spelling of the product name.
                    </p>
                  </div>
                )}

                <button
                  onClick={handleSearchNext}
                  className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Search Next Product
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 dark:text-gray-400">
                    Enter product details and click search to see results
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
