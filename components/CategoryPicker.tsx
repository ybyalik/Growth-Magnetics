import { useState, useEffect } from 'react';
import styles from './CategoryPicker.module.css';

interface Category {
  category_code: number;
  category_name: string;
  category_code_parent: number | null;
}

interface CategoryNode {
  code: number;
  name: string;
  children: CategoryNode[];
}

interface CategoryPickerProps {
  value: {
    categoryCode: number | null;
    categoryName: string;
    childCategories: number[];
  };
  onChange: (value: {
    categoryCode: number | null;
    categoryName: string;
    childCategories: number[];
  }) => void;
  maxChildren?: number;
  required?: boolean;
}

export default function CategoryPicker({ value, onChange, maxChildren = 3, required = false }: CategoryPickerProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [tree, setTree] = useState<CategoryNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || []);
        setTree(data.tree || []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const getParentCategories = () => {
    return categories.filter(c => c.category_code_parent === null);
  };

  const getChildCategories = (parentCode: number) => {
    return categories.filter(c => c.category_code_parent === parentCode);
  };

  const handleParentSelect = (cat: Category) => {
    onChange({
      categoryCode: cat.category_code,
      categoryName: cat.category_name,
      childCategories: []
    });
  };

  const handleChildToggle = (childCode: number) => {
    const current = value.childCategories || [];
    let updated: number[];
    
    if (current.includes(childCode)) {
      updated = current.filter(c => c !== childCode);
    } else if (current.length < maxChildren) {
      updated = [...current, childCode];
    } else {
      return;
    }

    onChange({
      ...value,
      childCategories: updated
    });
  };

  const getDisplayText = () => {
    if (!value.categoryCode) return 'Select category...';
    
    const childNames = (value.childCategories || [])
      .map(code => categories.find(c => c.category_code === code)?.category_name)
      .filter(Boolean);

    if (childNames.length > 0) {
      return `${value.categoryName} > ${childNames.join(', ')}`;
    }
    return value.categoryName;
  };

  const filteredParents = searchTerm
    ? getParentCategories().filter(c => 
        c.category_name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : getParentCategories();

  const selectedChildren = value.categoryCode ? getChildCategories(value.categoryCode) : [];

  if (loading) {
    return <div className={styles.picker}>Loading categories...</div>;
  }

  return (
    <div className={styles.picker}>
      <div 
        className={`${styles.trigger} ${isOpen ? styles.open : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={value.categoryCode ? styles.hasValue : styles.placeholder}>
          {getDisplayText()}
        </span>
        <span className={styles.arrow}>{isOpen ? '▲' : '▼'}</span>
      </div>

      {isOpen && (
        <div className={styles.dropdown}>
          <input
            type="text"
            placeholder="Search categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.search}
            onClick={(e) => e.stopPropagation()}
          />

          <div className={styles.columns}>
            <div className={styles.parentColumn}>
              <div className={styles.columnHeader}>Parent Category</div>
              <div className={styles.list}>
                {filteredParents.map(cat => (
                  <div
                    key={cat.category_code}
                    className={`${styles.item} ${value.categoryCode === cat.category_code ? styles.selected : ''}`}
                    onClick={() => handleParentSelect(cat)}
                  >
                    {cat.category_name}
                  </div>
                ))}
              </div>
            </div>

            {value.categoryCode && selectedChildren.length > 0 && (
              <div className={styles.childColumn}>
                <div className={styles.columnHeader}>
                  Sub-categories (max {maxChildren})
                </div>
                <div className={styles.list}>
                  {selectedChildren.map(cat => (
                    <label
                      key={cat.category_code}
                      className={`${styles.checkbox} ${(value.childCategories || []).includes(cat.category_code) ? styles.checked : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={(value.childCategories || []).includes(cat.category_code)}
                        onChange={() => handleChildToggle(cat.category_code)}
                        disabled={
                          !(value.childCategories || []).includes(cat.category_code) && 
                          (value.childCategories || []).length >= maxChildren
                        }
                      />
                      {cat.category_name}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className={styles.footer}>
            <button 
              type="button"
              className={styles.clearBtn}
              onClick={() => {
                onChange({ categoryCode: null, categoryName: '', childCategories: [] });
                setIsOpen(false);
              }}
            >
              Clear
            </button>
            <button 
              type="button"
              className={styles.doneBtn}
              onClick={() => setIsOpen(false)}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
