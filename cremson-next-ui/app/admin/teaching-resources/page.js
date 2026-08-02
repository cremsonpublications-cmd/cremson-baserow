"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { 
  Folder, 
  Link as LinkIcon, 
  Plus, 
  Edit2, 
  Trash2, 
  ChevronRight, 
  ChevronDown,
  ExternalLink,
  Layers
} from "lucide-react";
import api from "../../../lib/api/axios";
import ConfirmModal from "../components/ConfirmModal";

export default function TeachingResourcesAdminPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Collapse state for nodes (Set of IDs)
  const [collapsedIds, setCollapsedIds] = useState(new Set());

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add_main"); // "add_main" | "add_sub" | "edit"
  const [targetNode, setTargetNode] = useState(null); // Parent node for adding sub, or node being edited
  const [modalLabel, setModalLabel] = useState("");
  const [modalUrl, setModalUrl] = useState("");
  const [modalParentId, setModalParentId] = useState("");
  const [modalSaving, setModalSaving] = useState(false);

  // Delete states
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/teaching-resources/");
      setItems(res.data);
    } catch (err) {
      toast.error("Failed to load teaching resources.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const toggleCollapse = (id) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const openAddMainModal = () => {
    setModalMode("add_main");
    setTargetNode(null);
    setModalLabel("");
    setModalUrl("");
    setModalParentId("");
    setModalOpen(true);
  };

  const openAddSubModal = (parent) => {
    setModalMode("add_sub");
    setTargetNode(parent);
    setModalLabel("");
    setModalUrl("");
    setModalParentId(String(parent.id));
    setModalOpen(true);
  };

  const openEditModal = (node) => {
    setModalMode("edit");
    setTargetNode(node);
    setModalLabel(node.label);
    setModalUrl(node.url || "");
    setModalParentId(node.parent_id ? String(node.parent_id) : "");
    setModalOpen(true);
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    if (!modalLabel.trim()) {
      toast.error("Display Name is required!");
      return;
    }

    setModalSaving(true);
    try {
      const payload = {
        parent_id: modalParentId ? parseInt(modalParentId, 10) : null,
        label: modalLabel.trim(),
        url: modalUrl.trim() || null
      };

      if (modalMode === "edit") {
        await api.put(`/api/teaching-resources/${targetNode.id}`, payload);
        toast.success("Item updated successfully!");
      } else {
        await api.post("/api/teaching-resources/", payload);
        toast.success("Item created successfully!");
      }

      setModalOpen(false);
      fetchItems();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to save item.");
    } finally {
      setModalSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/api/teaching-resources/${deleteTarget.id}`);
      toast.success("Item deleted successfully!");
      setDeleteTarget(null);
      fetchItems();
    } catch (err) {
      toast.error("Failed to delete item.");
    } finally {
      setDeleteLoading(false);
    }
  };

  // Helper to find all descendants of a node (to prevent circular nesting in parent selection)
  const getDescendantIds = (nodeId, list) => {
    const ids = new Set();
    const children = list.filter((item) => item.parent_id === nodeId);
    children.forEach((child) => {
      ids.add(child.id);
      const childDescendants = getDescendantIds(child.id, list);
      childDescendants.forEach((id) => ids.add(id));
    });
    return ids;
  };

  // Build recursive tree for rendering with cycle protection
  const buildTree = (list) => {
    const map = {};
    const roots = [];
    
    list.forEach((item) => {
      map[item.id] = { ...item, children: [] };
    });

    list.forEach((item) => {
      const node = map[item.id];
      if (item.parent_id) {
        // Cycle detection
        let currParentId = item.parent_id;
        let isCycle = false;
        const seen = new Set([item.id]);

        while (currParentId) {
          if (seen.has(currParentId)) {
            isCycle = true;
            break;
          }
          seen.add(currParentId);
          const pNode = list.find((x) => x.id === currParentId);
          currParentId = pNode ? pNode.parent_id : null;
        }

        if (!isCycle && map[item.parent_id]) {
          map[item.parent_id].children.push(node);
        } else {
          roots.push(node);
        }
      } else {
        roots.push(node);
      }
    });

    return roots;
  };

  // Get flattened path labels for parent dropdown selector in edit mode
  const getFlatPaths = (list) => {
    const map = {};
    list.forEach((item) => {
      map[item.id] = item;
    });

    const getPathStr = (item) => {
      const parts = [];
      const visited = new Set();
      let curr = item;
      while (curr && !visited.has(curr.id)) {
        visited.add(curr.id);
        parts.unshift(curr.label);
        curr = curr.parent_id ? map[curr.parent_id] : null;
      }
      return parts.join(" > ");
    };

    return list.map((item) => ({
      id: item.id,
      path: getPathStr(item),
    })).sort((a, b) => a.path.localeCompare(b.path));
  };

  const tree = buildTree(items);
  const parentOptions = getFlatPaths(items);
  const descendants = targetNode && modalMode === "edit" ? getDescendantIds(targetNode.id, items) : new Set();

  // Render tree node component recursively
  const renderTreeNode = (node, depth = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const isCollapsed = collapsedIds.has(node.id);

    return (
      <div key={node.id} className="flex flex-col">
        <div className="flex justify-between items-center py-2 px-3 hover:bg-blue-50/30 rounded-lg group transition-all duration-150 border border-transparent hover:border-blue-100">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Expand/Collapse Toggle Button */}
            {!node.url ? (
              <button
                type="button"
                onClick={() => toggleCollapse(node.id)}
                className="w-5 h-5 flex items-center justify-center rounded hover:bg-gray-150 text-gray-500 transition cursor-pointer"
              >
                {isCollapsed ? (
                  <ChevronRight size={14} className="text-gray-400" />
                ) : (
                  <ChevronDown size={14} className="text-gray-500" />
                )}
              </button>
            ) : (
              <div className="w-5 h-5 flex items-center justify-center text-gray-400 select-none font-bold">
                •
              </div>
            )}

            {/* Folder / Link Icon */}
            {!node.url ? (
              <Folder size={16} className="text-blue-500 fill-blue-50/30 flex-shrink-0" />
            ) : (
              <LinkIcon size={16} className="text-green-500 flex-shrink-0" />
            )}

            {/* Labels and Redirect URL */}
            <div className="flex flex-wrap items-center gap-x-2 min-w-0">
              <span className="text-sm font-semibold text-gray-800 truncate">{node.label}</span>
              {node.url && (
                <span 
                  title={node.url}
                  className="text-green-600 hover:text-green-700 transition flex items-center justify-center p-0.5 rounded hover:bg-green-50"
                >
                  <ExternalLink size={12} />
                </span>
              )}
            </div>
          </div>

          {/* Action Operations */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {!node.url && (
              <button
                onClick={() => openAddSubModal(node)}
                title="Add Sub-item"
                className="flex items-center gap-1 text-xs border border-green-200 text-green-700 hover:bg-green-50 px-2 py-1 rounded-md transition cursor-pointer font-medium"
              >
                <Plus size={12} />
                <span>Add Sub</span>
              </button>
            )}
            <button
              onClick={() => openEditModal(node)}
              title="Edit Item"
              className="flex items-center gap-1 text-xs border border-blue-200 text-blue-750 hover:bg-blue-50 px-2 py-1 rounded-md transition cursor-pointer font-medium"
            >
              <Edit2 size={12} />
              <span>Edit</span>
            </button>
            <button
              onClick={() => setDeleteTarget(node)}
              title="Delete Item"
              className="flex items-center gap-1 text-xs border border-red-200 text-red-750 hover:bg-red-50 px-2 py-1 rounded-md transition cursor-pointer font-medium"
            >
              <Trash2 size={12} />
              <span>Delete</span>
            </button>
          </div>
        </div>

        {/* Render children recursively */}
        {hasChildren && !isCollapsed && (
          <div className="pl-6 border-l border-gray-150 ml-5 mt-1 space-y-1">
            {node.children.map((child) => renderTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const expandAll = () => {
    setCollapsedIds(new Set());
  };

  const collapseAll = () => {
    const allFolderIds = items.filter(x => !x.url).map(x => x.id);
    setCollapsedIds(new Set(allFolderIds));
  };

  return (
    <div className="flex-1 pt-5 px-5 sm:pt-12 sm:pl-16 bg-blue-50/50 min-h-screen text-gray-700 pb-20">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between max-w-5xl gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Layers className="text-primary w-5 h-5" />
            Teaching Resources Navigation
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Configure the nested hierarchical menu structure and redirects for the teaching resources mega-menu navigation.
          </p>
        </div>
        <button
          onClick={openAddMainModal}
          className="bg-primary text-white px-4 py-2 text-xs font-bold rounded-lg hover:opacity-90 active:scale-98 transition cursor-pointer flex items-center gap-2 shadow-sm"
        >
          <Plus size={14} />
          Add Main Category
        </button>
      </div>

      {/* Expand/Collapse Controls */}
      {items.length > 0 && (
        <div className="flex gap-2 mt-6 max-w-5xl">
          <button
            onClick={expandAll}
            className="text-[11px] font-bold text-gray-500 hover:text-gray-800 bg-white border border-gray-200 px-2.5 py-1 rounded-md hover:bg-gray-50 transition cursor-pointer"
          >
            Expand All
          </button>
          <button
            onClick={collapseAll}
            className="text-[11px] font-bold text-gray-500 hover:text-gray-800 bg-white border border-gray-200 px-2.5 py-1 rounded-md hover:bg-gray-50 transition cursor-pointer"
          >
            Collapse All
          </button>
        </div>
      )}

      {/* Main Interactive Tree Container */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mt-4 max-w-5xl min-h-[300px]">
        {loading ? (
          <div className="py-20 text-center text-sm text-gray-400">Loading hierarchy...</div>
        ) : tree.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center justify-center">
            <Folder size={40} className="text-gray-300 mb-3" />
            <p className="text-sm text-gray-400">No navigation items added yet.</p>
            <button
              onClick={openAddMainModal}
              className="mt-3 text-xs bg-primary/10 text-primary hover:bg-primary/20 px-3.5 py-1.5 rounded-lg font-bold transition cursor-pointer"
            >
              + Create First Category
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {tree.map((node) => renderTreeNode(node))}
          </div>
        )}
      </div>

      {/* Unified Add/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-gray-50 border-b border-gray-150 px-6 py-4">
              <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">
                {modalMode === "edit"
                  ? `Edit Item: "${targetNode?.label}"`
                  : modalMode === "add_sub"
                  ? `Add Sub-item under "${targetNode?.label}"`
                  : "Add Main Category"}
              </h3>
            </div>
            
            <form onSubmit={handleModalSubmit} className="p-6 space-y-4">
              {modalMode === "edit" && parentOptions.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">
                    Parent Category
                  </label>
                  <select
                    className="w-full p-2.5 border border-gray-300 outline-none rounded-lg text-sm text-gray-700 bg-white focus:border-primary transition-all cursor-pointer"
                    value={modalParentId}
                    onChange={(e) => setModalParentId(e.target.value)}
                  >
                    <option value="">None (Top-Level Category)</option>
                    {parentOptions
                      .filter((opt) => opt.id !== targetNode?.id && !descendants.has(opt.id))
                      .map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          {opt.path}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">
                  Display Name / Label
                </label>
                <input
                  placeholder="e.g. CBSE, Class 10, Syllabus"
                  className="w-full p-2.5 border border-gray-300 outline-none rounded-lg text-sm text-gray-700 focus:border-primary transition-all"
                  type="text"
                  value={modalLabel}
                  onChange={(e) => setModalLabel(e.target.value)}
                  autoFocus
                />
              </div>

              {/* URL Redirect Link */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">
                  Redirect URL (Optional)
                </label>
                <input
                  placeholder="e.g. /teaching-resource/... (leave blank for folder)"
                  className="w-full p-2.5 border border-gray-300 outline-none rounded-lg text-sm text-gray-700 focus:border-primary transition-all"
                  type="text"
                  value={modalUrl}
                  onChange={(e) => setModalUrl(e.target.value)}
                />
                <p className="text-[10px] text-gray-400 mt-1">
                  Leave blank to make this item acts as a nested folder that can contain sub-links.
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={modalSaving}
                  className="flex-1 py-2 bg-primary text-white text-xs font-semibold rounded-lg hover:opacity-90 active:scale-98 transition disabled:bg-gray-300 cursor-pointer shadow-sm flex items-center justify-center h-9"
                >
                  {modalSaving ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : modalMode === "edit" ? (
                    "Save Changes"
                  ) : (
                    "Create Item"
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-650 text-xs font-medium rounded-lg hover:bg-gray-50 transition cursor-pointer h-9"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <ConfirmModal
          title="Delete Navigation Item"
          message={`Are you sure you want to delete "${deleteTarget.label}"? Warning: deleting this item will also delete all of its nested children categories and links.`}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleteLoading}
        />
      )}
    </div>
  );
}
