import { useEffect, useMemo, useState } from "react";
import "./App.css";
import { fetchCourses, type Course } from "./api";
import CourseCard from "./components/CourseCard";
import ChatPanel from "./components/ChatPanel";

export default function App() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let live = true;
    fetchCourses()
      .then((data) => {
        if (!live) return;
        setCourses(data.courses);
        setError("");
      })
      .catch((err: unknown) => {
        if (!live) return;
        const detail = err instanceof Error ? err.message : String(err);
        setError(`Could not load courses (${detail}). Start the backend on port 8000.`);
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, []);

  const categories = useMemo(() => {
    const found = new Set<string>();
    courses.forEach((c) => {
      const value = (c["Course Category"] ?? "").trim();
      if (value) found.add(value);
    });
    return ["All", ...Array.from(found).sort()];
  }, [courses]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return courses.filter((c) => {
      if (category !== "All" && (c["Course Category"] ?? "").trim() !== category) {
        return false;
      }
      if (!needle) return true;
      return [
        c["Course Title"],
        c["Course Number"],
        c["Faculty 1"],
        c["Course Category"],
        c.Daytimes,
        c.Room,
        c["Course Description"],
      ]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
  }, [courses, query, category]);

  return (
    <div className="shell">
      <header className="masthead">
        <div className="masthead-inner">
          <p className="eyebrow">Yale School of Management</p>
          <h1>Course explorer</h1>
          <p className="lede">
            Browse the term catalog, then ask the assistant what the listing does not say.
          </p>
        </div>
      </header>

      <main className="layout">
        <section className="catalog" aria-label="Course catalog">
          <div className="controls">
            <div className="field">
              <label className="sr-only" htmlFor="course-search">
                Search courses
              </label>
              <input
                id="course-search"
                type="search"
                value={query}
                placeholder="Search by title, number, faculty or room"
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
            <div className="field field-narrow">
              <label className="sr-only" htmlFor="course-category">
                Filter by category
              </label>
              <select
                id="course-category"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
              >
                {categories.map((option) => (
                  <option key={option} value={option}>
                    {option === "All" ? "All categories" : option}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <p className="result-count">
            {loading
              ? "Loading catalog…"
              : `${visible.length} of ${courses.length} courses`}
          </p>

          {error && <p className="banner banner-error">{error}</p>}

          {!loading && !error && visible.length === 0 && (
            <p className="banner">No courses match that search.</p>
          )}

          <div className="grid">
            {visible.map((course) => (
              <CourseCard
                key={`${course["Course ID"]}-${course.Section}`}
                course={course}
              />
            ))}
          </div>
        </section>

        <aside className="rail">
          <ChatPanel />
        </aside>
      </main>
    </div>
  );
}
