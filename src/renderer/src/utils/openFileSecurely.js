// utils/openFileSecurely.ts
export const openFileSecurely = async (
  type,
  id,
  fileId,
  fileName = "download"
) => {
  try {
    const baseURL = import.meta.env.VITE_BASE_URL;
    const token = sessionStorage.getItem("token");

    if (!token) {
      alert("Authentication token missing");
      return;
    }

    // ✅ final correct URL
    const url = `${baseURL}${type}/viewFile/${id}/${fileId}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch file");
    }

    const blob = await response.blob();
    const fileURL = window.URL.createObjectURL(blob);

    // Create a temporary anchor element to trigger the download
    const a = document.createElement("a");
    a.href = fileURL;
    a.download = fileName; // Set the filename for the download
    document.body.appendChild(a);
    a.click();

    // Clean up
    window.URL.revokeObjectURL(fileURL);
    document.body.removeChild(a);
  } catch (err) {
    console.error("File open failed:", err);
    alert("Unable to open file");
  }
};
