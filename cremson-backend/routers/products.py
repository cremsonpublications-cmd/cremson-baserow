from fastapi import APIRouter, Query
from typing import Optional
from pydantic import BaseModel
from services.baserow import BaserowClient
from config import TABLE_IDS
import json

router = APIRouter()
client = BaserowClient()


class ProductCreate(BaseModel):
    name: str
    author: Optional[str] = None
    mrp: Optional[float] = None
    price: Optional[float] = None
    description: Optional[str] = None
    short_description: Optional[str] = None
    category_id: Optional[int] = None
    isbn: Optional[str] = None
    sku: Optional[str] = None
    edition: Optional[str] = None
    weight: Optional[str] = None
    dimension: Optional[str] = None
    stock_status: Optional[str] = "in_stock"
    status: Optional[str] = None
    is_active: Optional[bool] = True
    main_image: Optional[str] = None
    side_images: Optional[list] = None
    class_: Optional[str] = None
    sub_categories: Optional[str] = None
    delivery_info: Optional[str] = None
    returns_info: Optional[str] = None
    enable_bulk_pricing: Optional[bool] = False
    discount_type: Optional[str] = "none"
    has_own_discount: Optional[bool] = False
    own_discount_type: Optional[str] = None
    own_discount_val: Optional[float] = 0.0
    own_discount_percentage: Optional[int] = 0
    use_category_discount: Optional[bool] = False
    bulk_pricing: Optional[str] = None
    tags: Optional[str] = None
    is_combo: Optional[bool] = False
    combo_product_ids: Optional[str] = None
    display_order: Optional[int] = None


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    author: Optional[str] = None
    mrp: Optional[float] = None
    price: Optional[float] = None
    description: Optional[str] = None
    short_description: Optional[str] = None
    category_id: Optional[int] = None
    isbn: Optional[str] = None
    sku: Optional[str] = None
    edition: Optional[str] = None
    weight: Optional[str] = None
    dimension: Optional[str] = None
    stock_status: Optional[str] = None
    status: Optional[str] = None
    is_active: Optional[bool] = None
    main_image: Optional[str] = None
    side_images: Optional[list] = None
    class_: Optional[str] = None
    sub_categories: Optional[str] = None
    delivery_info: Optional[str] = None
    returns_info: Optional[str] = None
    enable_bulk_pricing: Optional[bool] = None
    discount_type: Optional[str] = None
    has_own_discount: Optional[bool] = None
    own_discount_type: Optional[str] = None
    own_discount_val: Optional[float] = None
    own_discount_percentage: Optional[int] = None
    use_category_discount: Optional[bool] = None
    bulk_pricing: Optional[str] = None
    tags: Optional[str] = None
    is_combo: Optional[bool] = None
    combo_product_ids: Optional[str] = None
    display_order: Optional[int] = None


def map_product_out(row: dict) -> dict:
    if not row:
        return row
    
    # 1. Map price
    mrp_val = row.get("mrp")
    try:
        mrp = float(mrp_val) if mrp_val is not None else 0.0
    except (ValueError, TypeError):
        mrp = 0.0

    discount_val = row.get("own_discount_percentage")
    try:
        discount_pct = float(discount_val) if discount_val is not None else 0.0
    except (ValueError, TypeError):
        discount_pct = 0.0

    has_discount = bool(row.get("has_own_discount"))
    
    if has_discount and discount_pct > 0:
        price = round(mrp * (1.0 - discount_pct / 100.0))
    else:
        price = mrp

    row["price"] = price

    # 2. Map class_
    classes_str = row.get("classes")
    if classes_str:
        try:
            classes_arr = json.loads(classes_str)
            if isinstance(classes_arr, list) and len(classes_arr) > 0:
                row["class_"] = classes_arr[0]
            else:
                row["class_"] = ""
        except Exception:
            row["class_"] = ""
    else:
        row["class_"] = ""

    # 3. Extract combo_product_ids & is_combo from tags or descriptions
    tags_str = str(row.get("tags") or "")
    desc_str = str(row.get("short_description") or "") + " " + str(row.get("description") or "")
    combined = tags_str + " " + desc_str

    if "COMBO_IDS:" in combined:
        try:
            combo_raw = combined.split("COMBO_IDS:")[1].strip()
            if combo_raw.startswith("["):
                end_idx = combo_raw.find("]")
                if end_idx != -1:
                    row["combo_product_ids"] = combo_raw[:end_idx+1]
                    row["is_combo"] = True
        except Exception:
            pass

    if row.get("author") == "Cremson Bundle":
        row["is_combo"] = True

    # 4. Map display_order
    display_order = row.get("display_order")
    if display_order is None:
        notes_str = str(row.get("Notes") or "")
        if "display_order:" in notes_str:
            try:
                part = notes_str.split("display_order:")[1].split(";")[0].split("\n")[0].strip()
                display_order = int(part)
            except (ValueError, IndexError):
                display_order = None
    try:
        row["display_order"] = int(display_order) if display_order is not None else 999999
    except (ValueError, TypeError):
        row["display_order"] = 999999

    return row


def map_product_in(data: dict, existing_mrp: float = 0.0) -> dict:
    # Ensure primary Name field is set for Baserow
    if "name" in data and data["name"]:
        data["Name"] = data["name"]

    # Clean up fields that are not columns in Baserow table
    data.pop("price", None)
    data.pop("stock_status", None)
    data.pop("delivery_info", None)
    data.pop("returns_info", None)
    data.pop("discount_type", None)
    data.pop("own_discount_type", None)
    data.pop("own_discount_val", None)
    data.pop("side_images", None)
    data.pop("is_combo", None)
    data.pop("combo_product_ids", None)

    # Ensure mrp is an int to avoid Baserow max_decimal_places error
    if "mrp" in data and data["mrp"] is not None:
        try:
            data["mrp"] = int(round(float(data["mrp"])))
        except (ValueError, TypeError):
            pass

    if "own_discount_percentage" in data and data["own_discount_percentage"] is not None:
        try:
            data["own_discount_percentage"] = int(round(float(data["own_discount_percentage"])))
        except (ValueError, TypeError):
            pass

    # Convert empty strings to None for optional text fields to avoid constraint errors
    for field in ["isbn", "sku", "edition", "short_description", "description", "status", "sub_categories", "tags"]:
        if field in data and data[field] == "":
            data[field] = None

    # Handle class_ mapping to classes
    if "class_" in data:
        class_val = data.pop("class_")
        if class_val:
            data["classes"] = json.dumps([class_val])
        else:
            data["classes"] = json.dumps([])

    return data


@router.get("/", summary="List products")
async def list_products(
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(100, ge=1, le=200, description="Rows per page"),
    search: str = Query(None, description="Search string"),
    category_id: Optional[int] = Query(None, description="Filter by category ID"),
    category: Optional[str] = Query(None, description="Filter by category name (comma-separated)"),
    author: Optional[str] = Query(None, description="Filter by author (comma-separated)"),
    edition: Optional[str] = Query(None, description="Filter by edition (comma-separated)"),
    stock_status: Optional[str] = Query(None, description="Filter by stock status (comma-separated)"),
    max_price: Optional[float] = Query(None, description="Filter by max price"),
    classes: Optional[str] = Query(None, description="Filter by class (comma-separated)"),
    sub_category: Optional[str] = Query(None, description="Filter by sub category (comma-separated)"),
    sort_by: Optional[str] = Query(None, description="Sort: price-asc, price-desc, rating"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    is_combo: Optional[bool] = Query(None, description="Filter by combo status"),
    order_by: Optional[str] = Query("-id", description="Order by field"),
):
    """Return a paginated list of products with optional server-side filtering and sorting."""
    filters = {}
    if category_id is not None and isinstance(category_id, int):
        filters["category_id"] = category_id
    if is_active is not None and isinstance(is_active, bool):
        filters["is_active"] = str(is_active).lower()

    search_str = search if isinstance(search, str) else None

    res = await client.get_rows(
        TABLE_IDS["products"],
        page=1,
        size=200,
        search=search_str,
        filters=filters if filters else None,
    )

    if isinstance(res, dict) and "results" in res:
        all_results = sorted([map_product_out(r) for r in res["results"]], key=lambda x: (x.get("display_order", 999999), -x.get("id", 0)))
    elif isinstance(res, list):
        all_results = sorted([map_product_out(r) for r in res], key=lambda x: (x.get("display_order", 999999), -x.get("id", 0)))
    else:
        return {"count": 0, "results": []}

    def check_combo(item):
        return bool(
            item.get("is_combo") or
            item.get("author") == "Cremson Bundle" or
            "Combo" in str(item.get("tags") or "") or
            (item.get("combo_product_ids") and str(item.get("combo_product_ids")) != "[]")
        )

    if is_combo is not None and isinstance(is_combo, bool):
        if is_combo:
            all_results = [r for r in all_results if check_combo(r)]
        else:
            all_results = [r for r in all_results if not check_combo(r)]

    if category and isinstance(category, str):
        cat_names = [c.strip().lower() for c in category.split(",")]
        all_results = [r for r in all_results if (r.get("category") or "").lower() in cat_names]

    if author and isinstance(author, str):
        author_names = [a.strip().lower() for a in author.split(",")]
        all_results = [r for r in all_results if (r.get("author") or "").lower() in author_names]

    if edition and isinstance(edition, str):
        editions = [e.strip() for e in edition.split(",")]
        all_results = [r for r in all_results if (r.get("edition") or "") in editions]

    if stock_status and isinstance(stock_status, str):
        statuses = [s.strip() for s in stock_status.split(",")]
        all_results = [r for r in all_results if (r.get("stock_status") or "") in statuses]

    if max_price is not None:
        try:
            mp = float(max_price)
            all_results = [r for r in all_results if (r.get("price") or 0) <= mp]
        except (ValueError, TypeError):
            pass

    if classes and isinstance(classes, str):
        class_names = [c.strip().lower() for c in classes.split(",")]
        def has_class(item):
            cls_raw = item.get("classes") or ""
            try:
                cls_arr = json.loads(cls_raw) if isinstance(cls_raw, str) and cls_raw else (cls_raw or [])
                return any(str(c).lower() in class_names for c in cls_arr)
            except Exception:
                return False
        all_results = [r for r in all_results if has_class(r)]

    if sub_category and isinstance(sub_category, str):
        sub_names = [s.strip().lower() for s in sub_category.split(",")]
        def has_sub(item):
            sub_raw = item.get("sub_categories") or ""
            try:
                sub_arr = json.loads(sub_raw) if isinstance(sub_raw, str) and sub_raw else (sub_raw or [])
                return any(str(s).lower() in sub_names for s in sub_arr)
            except Exception:
                return False
        all_results = [r for r in all_results if has_sub(r)]

    if sort_by == "price-asc":
        all_results.sort(key=lambda x: x.get("price") or 0)
    elif sort_by == "price-desc":
        all_results.sort(key=lambda x: x.get("price") or 0, reverse=True)
    elif sort_by == "rating":
        all_results.sort(key=lambda x: float(x.get("rating") or 0), reverse=True)

    start = (page - 1) * size
    end = start + size
    return {
        "count": len(all_results),
        "results": all_results[start:end],
    }


class ProductOrderItem(BaseModel):
    id: int
    display_order: int


class ReorderProductsPayload(BaseModel):
    orders: list[ProductOrderItem]


@router.post("/reorder", summary="Reorder products display order")
async def reorder_products(body: ReorderProductsPayload):
    """Bulk update display_order for products."""
    for item in body.orders:
        try:
            await client.update_row(TABLE_IDS["products"], item.id, {"display_order": item.display_order})
        except Exception as e:
            print(f"Error updating product {item.id} display order: {e}")
    return {"success": True, "count": len(body.orders)}


@router.get("/{row_id}", summary="Get a single product")
async def get_product(row_id: int):
    """Return a single product by Baserow row ID."""
    row = await client.get_row(TABLE_IDS["products"], row_id)
    return map_product_out(row)


@router.post("/", summary="Create product")
async def create_product(body: ProductCreate):
    data = {k: v for k, v in body.model_dump(exclude_none=True).items()}
    data = map_product_in(data)
    row = await client.create_row(TABLE_IDS["products"], data)
    return map_product_out(row)


@router.patch("/{row_id}", summary="Update product")
async def update_product(row_id: int, body: ProductUpdate):
    data = {k: v for k, v in body.model_dump(exclude_none=True).items()}
    data = map_product_in(data)
    row = await client.update_row(TABLE_IDS["products"], row_id, data)
    return map_product_out(row)


@router.delete("/{row_id}", summary="Delete product")
async def delete_product(row_id: int):
    await client.delete_row(TABLE_IDS["products"], row_id)
    return {"success": True}


