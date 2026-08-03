import httpx
from urllib.parse import quote
from typing import Optional, Any
from config import BASEROW_URL, BASEROW_TOKEN


class BaserowClient:
    def __init__(self):
        self.base_url = BASEROW_URL.rstrip("/")
        self.headers = {
            "Authorization": f"Token {BASEROW_TOKEN}",
            "Content-Type": "application/json",
        }
        self._fields_cache = {}

    async def get_table_fields(self, table_id: int) -> list[dict]:
        """Fetch and cache table field definitions to prevent schema mismatch errors."""
        if table_id in self._fields_cache:
            return self._fields_cache[table_id]

        url = f"{self.base_url}/api/database/fields/table/{table_id}/"
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(url, headers=self.headers)
            response.raise_for_status()
            fields = response.json()
            self._fields_cache[table_id] = fields
            return fields

    async def sanitize_payload(self, table_id: int, payload: dict) -> dict:
        """Sanitize payload by removing non-existent fields and handling unsupported single select options."""
        try:
            fields = await self.get_table_fields(table_id)
        except Exception as e:
            print(f"Warning: Failed to fetch schema for table {table_id}: {e}")
            return payload

        field_map = {f["name"]: f for f in fields}
        sanitized = {}
        notes_to_append = []

        for key, value in payload.items():
            if key not in field_map:
                if value is not None and value != "":
                    notes_to_append.append(f"{key}: {value}")
                continue

            field_info = field_map[key]
            field_type = field_info.get("type")

            if field_type == "single_select":
                options = [opt["value"] for opt in field_info.get("select_options", [])]
                if value not in options and value is not None and value != "":
                    if key != "Status":
                        notes_to_append.append(f"{key}: {value}")
                    sanitized[key] = None
                else:
                    sanitized[key] = value
            else:
                sanitized[key] = value

        if notes_to_append:
            notes_key = "Notes" if "Notes" in field_map else ("Feedback/Notes" if "Feedback/Notes" in field_map else None)
            if notes_key:
                current_notes = sanitized.get(notes_key) or payload.get(notes_key) or ""
                extra_notes = "; ".join(notes_to_append)
                if current_notes:
                    sanitized[notes_key] = f"{current_notes} | {extra_notes}"
                else:
                    sanitized[notes_key] = extra_notes

        return sanitized


    async def get_rows(
        self,
        table_id: int,
        page: int = 1,
        size: int = 100,
        search: Optional[str] = None,
        filters: Optional[dict[str, Any]] = None,
        contains_filters: Optional[dict[str, Any]] = None,
        order_by: Optional[str] = None,
    ) -> dict:
        """
        Fetch paginated rows from a Baserow table.

        Args:
            table_id: The Baserow table ID.
            page: Page number (1-based).
            size: Number of rows per page (max 200).
            search: Optional search string applied across all text fields.
            filters: Optional dict of field_name -> value for simple equality filters.
                     e.g. {"field_name": "value"} will be sent as filter__field_name__equal=value
            order_by: Optional comma-separated field names to sort by (prefix with - for descending).

        Returns:
            dict with keys: count, next, previous, results
        """
        url = (
            f"{self.base_url}/api/database/rows/table/{table_id}/"
            f"?user_field_names=true&page={page}&size={size}"
        )

        if search:
            url += f"&search={search}"

        if order_by:
            url += f"&order_by={order_by}"

        if filters:
            # Fields that use single_select/multiple_select — use 'contains'
            select_fields = {"Status", "Interest Level", "DecisionPower", "Board", "Series", "DeliveryStatus", "FollowUpStage", "DispatchMethod"}
            # Fields that are link-row (linked table) — use 'link_row_contains'
            link_row_fields = {"BookCategory", "TeacherID", "SchoolID"}
            for field_name, value in filters.items():
                if field_name in link_row_fields:
                    op = "link_row_contains"
                elif field_name in select_fields:
                    op = "contains"
                else:
                    op = "equal"
                url += f"&filter__{quote(str(field_name))}__{op}={quote(str(value))}"

        if contains_filters:
            for field_name, value in contains_filters.items():
                url += f"&filter__{quote(str(field_name))}__contains={quote(str(value))}"

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(url, headers=self.headers)
            response.raise_for_status()
            return response.json()

    async def get_row(self, table_id: int, row_id: int) -> dict:
        """
        Fetch a single row from a Baserow table.

        Args:
            table_id: The Baserow table ID.
            row_id: The row ID to fetch.

        Returns:
            dict representing the row fields.
        """
        url = (
            f"{self.base_url}/api/database/rows/table/{table_id}/{row_id}/"
            f"?user_field_names=true"
        )

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(url, headers=self.headers)
            response.raise_for_status()
            return response.json()

    async def create_row(self, table_id: int, data: dict) -> dict:
        """
        Create a new row in a Baserow table.

        Args:
            table_id: The Baserow table ID.
            data: Dict representing the row fields.

        Returns:
            dict representing the newly created row.
        """
        sanitized_data = await self.sanitize_payload(table_id, data)
        url = f"{self.base_url}/api/database/rows/table/{table_id}/?user_field_names=true"

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(url, json=sanitized_data, headers=self.headers)
            response.raise_for_status()
            return response.json()

    async def update_row(self, table_id: int, row_id: int, data: dict) -> dict:
        """
        Update an existing row in a Baserow table.

        Args:
            table_id: The Baserow table ID.
            row_id: The ID of the row to update.
            data: Dict of fields to update.

        Returns:
            dict representing the updated row.
        """
        sanitized_data = await self.sanitize_payload(table_id, data)
        url = f"{self.base_url}/api/database/rows/table/{table_id}/{row_id}/?user_field_names=true"

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.patch(url, json=sanitized_data, headers=self.headers)
            response.raise_for_status()
            return response.json()


    async def delete_row(self, table_id: int, row_id: int) -> None:
        """
        Delete a row from a Baserow table.

        Args:
            table_id: The Baserow table ID.
            row_id: The ID of the row to delete.
        """
        url = f"{self.base_url}/api/database/rows/table/{table_id}/{row_id}/"

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.delete(url, headers=self.headers)
            response.raise_for_status()

