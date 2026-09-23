// Calls the FastAPI backend. CORS is already open in Backend/main.py.
export const API_BASE = "http://127.0.0.1:8000";

// Keys match the raw rows in data/yale_som_classes.json, which /api/courses returns as-is.
export interface Course {
  "Course ID": string;
  "Course Number": string;
  "Course Title": string;
  "Course Category": string;
  "Course Type": string;
  "Course Description": string;
  "Course Session": string;
  "Course Session Start date": string;
  "Course Session End Date": string;
  "Faculty 1": string;
  "Faculty 1 Email": string;
  faculty_bio: string;
  Daytimes: string;
  "Timings Day": string;
  "Timings StartTime": string;
  "Timings EndTime": string;
  Room: string;
  Section: string;
  Units: string;
  "Bid Or Permission": string;
  Syllabus: string;
  "Old Syllabus": string;
  TermCode: string;
  Visible: string;
}

export interface CoursesResponse {
  count: number;
  courses: Course[];
}

export interface ChatResponse {
  reply: string;
  tools_used: string[];
}

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`);
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }
  return (await response.json()) as T;
}

export function fetchCourses(query?: string): Promise<CoursesResponse> {
  const suffix = query && query.trim() ? `?q=${encodeURIComponent(query.trim())}` : "";
  return getJson<CoursesResponse>(`/api/courses${suffix}`);
}

export function fetchHealth(): Promise<{ ok: boolean; courses_file: string }> {
  return getJson<{ ok: boolean; courses_file: string }>("/api/health");
}

export async function sendChat(message: string): Promise<ChatResponse> {
  const response = await fetch(`${API_BASE}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }
  return (await response.json()) as ChatResponse;
}
