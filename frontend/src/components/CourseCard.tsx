import { useState } from "react";
import type { Course } from "../api";

function clean(value: string): string {
  return (value ?? "").trim();
}

export default function CourseCard({ course }: { course: Course }) {
  const [open, setOpen] = useState(false);

  const title = clean(course["Course Title"]) || "Untitled course";
  const number = clean(course["Course Number"]);
  const category = clean(course["Course Category"]);
  const faculty = clean(course["Faculty 1"]);
  const email = clean(course["Faculty 1 Email"]);
  const daytimes = clean(course.Daytimes);
  const room = clean(course.Room);
  const units = clean(course.Units);
  const session = clean(course["Course Session"]);
  const bid = clean(course["Bid Or Permission"]);
  const description = clean(course["Course Description"]);
  const bio = clean(course.faculty_bio);
  const syllabus = clean(course.Syllabus) || clean(course["Old Syllabus"]);

  return (
    <article className="card">
      <header className="card-head">
        <div className="card-heading">
          {number && <p className="card-number">{number}</p>}
          <h3 className="card-title">{title}</h3>
        </div>
        {category && <span className="badge">{category}</span>}
      </header>

      <dl className="card-facts">
        <div>
          <dt>Faculty</dt>
          <dd>{faculty || "Not listed"}</dd>
        </div>
        <div>
          <dt>Meets</dt>
          <dd>{daytimes || "Not listed"}</dd>
        </div>
        <div>
          <dt>Room</dt>
          <dd>{room || "Not listed"}</dd>
        </div>
        <div>
          <dt>Units</dt>
          <dd>{units || "Not listed"}</dd>
        </div>
      </dl>

      {description && (
        <p className={open ? "card-desc" : "card-desc card-desc-clamped"}>{description}</p>
      )}

      {open && (
        <div className="card-extra">
          {bio && (
            <section>
              <h4>About {faculty || "the instructor"}</h4>
              <p>{bio}</p>
            </section>
          )}
          <dl className="card-facts">
            <div>
              <dt>Session</dt>
              <dd>{session || "Not listed"}</dd>
            </div>
            <div>
              <dt>Enrolment</dt>
              <dd>{bid || "Not listed"}</dd>
            </div>
          </dl>
          {email && (
            <p className="card-email">
              <a href={`mailto:${email}`}>{email}</a>
            </p>
          )}
        </div>
      )}

      <footer className="card-foot">
        <button type="button" className="link-button" onClick={() => setOpen(!open)}>
          {open ? "Show less" : "Show more"}
        </button>
        {syllabus && (
          <a className="link-button" href={syllabus} target="_blank" rel="noreferrer">
            Syllabus
          </a>
        )}
      </footer>
    </article>
  );
}
