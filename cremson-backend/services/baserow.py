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
            for field_name, value in filters.items():
                url += f"&filter__{quote(str(field_name))}__equal={quote(str(value))}"

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
        url = f"{self.base_url}/api/database/rows/table/{table_id}/?user_field_names=true"

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(url, json=data, headers=self.headers)
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
        url = f"{self.base_url}/api/database/rows/table/{table_id}/{row_id}/?user_field_names=true"

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.patch(url, json=data, headers=self.headers)
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

