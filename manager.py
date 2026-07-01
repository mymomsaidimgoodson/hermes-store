import tkinter as tk
from tkinter import ttk, filedialog, messagebox
import json
import os
import shutil

# Путь к нашему JSON и папке с картинками (относительно скрипта)
JSON_FILE = 'products.json'
IMAGES_DIR = 'assets/images'

class HermesAdminApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Hermes Store - CMS (Система управления)")
        self.root.geometry("1100x700") # Слегка увеличили высоту окна для нового поля
        self.root.configure(padx=15, pady=15)

        self.selected_image_path = None
        self.editing_id = None 
        self.products_data = [] 

        self.create_widgets()
        self.load_products()

    def create_widgets(self):
        # Разделяем экран на две части: левая (форма) и правая (дерево)
        left_frame = ttk.Frame(self.root, width=400)
        left_frame.pack(side="left", fill="y", padx=(0, 15))
        
        right_frame = ttk.Frame(self.root)
        right_frame.pack(side="right", fill="both", expand=True)

        # --- ЛЕВАЯ ЧАСТЬ (ФОРМА) ---
        self.form_title = ttk.Label(left_frame, text="✨ Добавление нового товара", font=("Arial", 14, "bold"))
        self.form_title.pack(anchor="w", pady=(0, 15))

        ttk.Label(left_frame, text="Название товара:").pack(anchor="w")
        self.name_entry = ttk.Entry(left_frame, width=50)
        self.name_entry.pack(fill="x", pady=(0, 10))

        ttk.Label(left_frame, text="Цена (₽):").pack(anchor="w")
        self.price_entry = ttk.Entry(left_frame, width=50)
        self.price_entry.pack(fill="x", pady=(0, 10))

        ttk.Label(left_frame, text="Категория (Главная):").pack(anchor="w")
        self.category_entry = ttk.Entry(left_frame, width=50)
        self.category_entry.pack(fill="x", pady=(0, 10))

        ttk.Label(left_frame, text="Подкатегория (Модель/Тип):").pack(anchor="w")
        self.subcategory_entry = ttk.Entry(left_frame, width=50)
        self.subcategory_entry.pack(fill="x", pady=(0, 10))

        # НОВОЕ ПОЛЕ: Ссылка на Авито
        ttk.Label(left_frame, text="Ссылка на Авито:").pack(anchor="w")
        self.avito_entry = ttk.Entry(left_frame, width=50)
        self.avito_entry.pack(fill="x", pady=(0, 10))

        ttk.Label(left_frame, text="Характеристики (Формат -> Разъем: Type-C):").pack(anchor="w")
        self.specs_text = tk.Text(left_frame, height=5, width=50, font=("Arial", 10))
        self.specs_text.pack(fill="x", pady=(0, 15))

        self.img_btn = ttk.Button(left_frame, text="Выбрать новое фото...", command=self.choose_image)
        self.img_btn.pack(fill="x", pady=(0, 5))
        self.img_label = ttk.Label(left_frame, text="Файл не выбран", foreground="gray")
        self.img_label.pack(anchor="w", pady=(0, 15))

        # Кнопки управления формой
        btn_frame = ttk.Frame(left_frame)
        btn_frame.pack(fill="x")

        self.save_btn = ttk.Button(btn_frame, text="СОХРАНИТЬ", command=self.save_product)
        self.save_btn.pack(side="left", fill="x", expand=True, padx=(0, 5))

        self.cancel_btn = ttk.Button(btn_frame, text="ОЧИСТИТЬ ФОРМУ", command=self.reset_form)
        self.cancel_btn.pack(side="right", fill="x", expand=True)
        
        self.del_btn = ttk.Button(left_frame, text="❌ УДАЛИТЬ ТОВАР", command=self.delete_product)
        self.del_btn.pack(fill="x", pady=(10, 0))

        # --- ПРАВАЯ ЧАСТЬ (ДЕРЕВО ТОВАРОВ + ПОИСК) ---
        right_header = ttk.Frame(right_frame)
        right_header.pack(fill="x", pady=(0, 15))

        ttk.Label(right_header, text="📦 База товаров", font=("Arial", 14, "bold")).pack(side="left")

        self.search_entry = ttk.Entry(right_header, width=30)
        self.search_entry.pack(side="right")
        self.search_entry.bind("<KeyRelease>", self.on_search) 
        ttk.Label(right_header, text="🔍 Поиск:").pack(side="right", padx=(0, 5))

        # Настраиваем таблицу
        columns = ("id", "name", "category", "price")
        self.tree = ttk.Treeview(right_frame, columns=columns, show="headings", selectmode="browse")
        self.tree.heading("id", text="ID")
        self.tree.heading("name", text="Название")
        self.tree.heading("category", text="Категория")
        self.tree.heading("price", text="Цена")

        self.tree.column("id", width=50, anchor="center")
        self.tree.column("name", width=300)
        self.tree.column("category", width=150)
        self.tree.column("price", width=80, anchor="e")

        scrollbar = ttk.Scrollbar(right_frame, orient="vertical", command=self.tree.yview)
        self.tree.configure(yscroll=scrollbar.set)
        scrollbar.pack(side="right", fill="y")
        self.tree.pack(side="left", fill="both", expand=True)

        self.tree.bind("<<TreeviewSelect>>", self.on_item_select)

    def on_search(self, event):
        self.update_tree()

    def load_products(self):
        self.products_data = []
        if os.path.exists(JSON_FILE):
            try:
                with open(JSON_FILE, 'r', encoding='utf-8') as f:
                    self.products_data = json.load(f)
            except Exception:
                pass
        self.update_tree()

    def update_tree(self):
        for item in self.tree.get_children():
            self.tree.delete(item)
            
        query = self.search_entry.get().lower().strip()

        for p in self.products_data:
            name_match = query in p.get("name", "").lower()
            cat_match = query in p.get("category", "").lower()
            id_match = query == str(p.get("id"))

            if not query or name_match or cat_match or id_match:
                self.tree.insert("", "end", values=(p.get("id"), p.get("name"), p.get("category"), f"{p.get('price')} ₽"))

    def choose_image(self):
        file_path = filedialog.askopenfilename(
            title="Выберите фото товара",
            filetypes=[("Image Files", "*.jpg *.jpeg *.png *.webp")]
        )
        if file_path:
            self.selected_image_path = file_path
            self.img_label.config(text=f"Выбрано: {os.path.basename(file_path)}", foreground="green")

    def on_item_select(self, event):
        selected = self.tree.selection()
        if not selected:
            return
        
        item_values = self.tree.item(selected[0], "values")
        product_id = int(item_values[0])
        
        # Умное сравнение
        product = next((p for p in self.products_data if str(p.get("id")) == str(product_id)), None)
        if not product:
            return

        self.editing_id = product_id
        self.form_title.config(text=f"✏️ Редактирование товара ID: {product_id}", foreground="blue")
        
        # Заполняем поля
        self.name_entry.delete(0, tk.END)
        self.name_entry.insert(0, product.get("name", ""))
        
        self.price_entry.delete(0, tk.END)
        self.price_entry.insert(0, str(product.get("price", "")))
        
        self.category_entry.delete(0, tk.END)
        self.category_entry.insert(0, product.get("category", ""))
        
        self.subcategory_entry.delete(0, tk.END)
        self.subcategory_entry.insert(0, product.get("subcategory", ""))

        # Подтягиваем ссылку на Авито
        self.avito_entry.delete(0, tk.END)
        self.avito_entry.insert(0, product.get("avitoLink", ""))
        
        self.specs_text.delete("1.0", tk.END)
        specs = product.get("filters", {})
        for key, val in specs.items():
            self.specs_text.insert(tk.END, f"{key}: {val}\n")
            
        self.selected_image_path = None
        current_image = product.get("images", [""])[0] if product.get("images") else ""
        self.img_label.config(text=f"Текущее фото: {os.path.basename(current_image)} (оставьте, чтобы не менять)", foreground="gray")

    def reset_form(self):
        self.editing_id = None
        self.form_title.config(text="✨ Добавление нового товара", foreground="black")
        self.name_entry.delete(0, tk.END)
        self.price_entry.delete(0, tk.END)
        self.category_entry.delete(0, tk.END)
        self.subcategory_entry.delete(0, tk.END)
        self.avito_entry.delete(0, tk.END) # Очищаем Авито
        self.specs_text.delete("1.0", tk.END)
        self.selected_image_path = None
        self.img_label.config(text="Файл не выбран", foreground="gray")
        
        for item in self.tree.selection():
            self.tree.selection_remove(item)

    def delete_product(self):
        if not self.editing_id:
            messagebox.showwarning("Внимание", "Сначала выберите товар в таблице справа для удаления.")
            return
            
        if messagebox.askyesno("Подтверждение", f"Вы точно хотите удалить этот товар из базы?"):
            self.products_data = [p for p in self.products_data if p["id"] != self.editing_id]
            self.save_to_file()
            self.update_tree()
            self.reset_form()
            messagebox.showinfo("Успех", "Товар успешно удален!")

    def save_product(self):
        name = self.name_entry.get().strip()
        price_str = self.price_entry.get().strip()
        category = self.category_entry.get().strip()
        subcategory = self.subcategory_entry.get().strip()
        avito_url = self.avito_entry.get().strip() # Читаем ссылку
        specs_raw = self.specs_text.get("1.0", tk.END).strip()

        if not name or not price_str or not category:
            messagebox.showerror("Ошибка", "Заполните обязательные поля (Название, Цена, Категория)!")
            return

        try:
            price = int(price_str)
        except ValueError:
            messagebox.showerror("Ошибка", "Цена должна быть числом!")
            return
        
        if not self.editing_id and not self.selected_image_path:
            messagebox.showerror("Ошибка", "Для нового товара обязательно выберите фото!")
            return

        filters_dict = {}
        if specs_raw:
            for line in specs_raw.split('\n'):
                if ':' in line:
                    key, val = line.split(':', 1)
                    filters_dict[key.strip()] = val.strip()

        safe_category_folder = category.replace(" ", "-").lower()
        target_dir = os.path.join(IMAGES_DIR, safe_category_folder)
        os.makedirs(target_dir, exist_ok=True)

        json_image_path = None
        
        if self.selected_image_path:
            filename = os.path.basename(self.selected_image_path)
            safe_filename = filename.replace(" ", "-").lower()
            destination_path = os.path.join(target_dir, safe_filename)
            try:
                # Если пути не совпадают, копируем
                if os.path.abspath(self.selected_image_path) != os.path.abspath(destination_path):
                    shutil.copy2(self.selected_image_path, destination_path)
                json_image_path = f"{IMAGES_DIR}/{safe_category_folder}/{safe_filename}"
            except shutil.SameFileError:
                # Если файл уже лежит в нужной папке проекта, просто запоминаем путь
                json_image_path = f"{IMAGES_DIR}/{safe_category_folder}/{safe_filename}"
            except Exception as e:
                messagebox.showerror("Ошибка", f"Не удалось скопировать файл: {e}")
                return
        
        if self.editing_id:
            # РЕДАКТИРОВАНИЕ
            product = next((p for p in self.products_data if p["id"] == self.editing_id), None)
            if product:
                product["name"] = name
                product["price"] = price
                product["category"] = category
                product["subcategory"] = subcategory
                product["avitoLink"] = avito_url # Сохраняем ссылку в базу
                product["filters"] = filters_dict
                product["specs"] = filters_dict
                if json_image_path:
                    product["images"] = [json_image_path]
            msg = f"Товар '{name}' успешно обновлен!"
        else:
            # СОЗДАНИЕ НОВОГО
            new_id = 1
            if self.products_data:
                valid_ids = []
                for p in self.products_data:
                    try:
                        valid_ids.append(int(p.get('id', 0)))
                    except (ValueError, TypeError):
                        pass
                if valid_ids:
                    new_id = max(valid_ids) + 1

            new_product = {
                "id": new_id,
                "name": name,
                "price": price,
                "category": category,
                "subcategory": subcategory,
                "avitoLink": avito_url, # Сохраняем ссылку в базу
                "images": [json_image_path] if json_image_path else [],
                "filters": filters_dict,
                "specs": filters_dict
            }
            self.products_data.append(new_product)
            msg = f"Товар '{name}' успешно добавлен!"

        self.save_to_file()
        self.update_tree()
        self.reset_form()
        messagebox.showinfo("Успех", msg)

    def save_to_file(self):
        with open(JSON_FILE, 'w', encoding='utf-8') as f:
            json.dump(self.products_data, f, ensure_ascii=False, indent=4)

if __name__ == "__main__":
    root = tk.Tk()
    app = HermesAdminApp(root)
    root.mainloop()