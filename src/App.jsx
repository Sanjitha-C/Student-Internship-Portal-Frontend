import { useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useParams
} from "react-router-dom";

const API = (
  import.meta.env.VITE_API_URL || ""
).replace(/\/+$/, "");

async function apiRequest(path, options = {}) {
  if (!API) {
    throw new Error("Backend URL is missing from the React .env file.");
  }

  let response;

  try {
    response = await fetch(`${API}${path}`, options);
  } catch {
    throw new Error(
      "Cannot connect to the backend. Check its URL, server status and CORS settings."
    );
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || `Request failed (${response.status})`);
  }

  return data;
}

function InternshipList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    apiRequest("/api/internships")
      .then(setItems)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="container">
      <header className="hero">
        <span className="eyebrow">CAREER OPPORTUNITIES</span>
        <h1>Student Internship Portal</h1>
        <p>
          Explore internships, discover new skills and take the next step
          in your career.
        </p>
      </header>

      <div className="section-heading">
        <div>
          <h2>Available Internships</h2>
          <p>Choose an opportunity to view its complete details.</p>
        </div>
        {!loading && !error && (
          <span className="count">{items.length} opportunities</span>
        )}
      </div>

      {loading && <p className="notice">Loading internships...</p>}
      {error && <p className="error">{error}</p>}

      {!loading && !error && items.length === 0 && (
        <p className="notice">No internships are available right now.</p>
      )}

      <div className="grid">
        {items.map((item) => (
          <article className="card" key={item.id}>
            <span className="tag">{item.category}</span>
            <h3>{item.title}</h3>
            <p className="company">{item.company}</p>

            <div className="meta">
              <span>Location: {item.location}</span>
              <span>Duration: {item.duration}</span>
            </div>

            <p className="description">{item.description}</p>

            <Link
              className="button"
              to={`/internships/${encodeURIComponent(item.id)}`}
            >
              View Details →
            </Link>
          </article>
        ))}
      </div>
    </main>
  );
}

function InternshipDetails() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    setItem(null);
    setError("");
    setLoading(true);

    apiRequest(`/api/internships/${encodeURIComponent(id)}`)
      .then((data) => {
        if (active) setItem(data);
      })
      .catch((err) => {
        if (active) setError(err.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return <main className="container">Loading internship details...</main>;
  }

  if (error || !item) {
    return (
      <main className="container">
        <h1>Unable to load internship</h1>
        <p className="error">{error || "Internship not found."}</p>
        <Link to="/">← Back to internships</Link>
      </main>
    );
  }

  return (
    <main className="container">
      <Link className="back-link" to="/">
        ← Back to internships
      </Link>

      <section className="details-hero">
        <span className="tag">{item.category}</span>
        <h1>{item.title}</h1>
        <p className="company">{item.company}</p>

        <div className="detail-meta">
          <span>Location: {item.location}</span>
          <span>Duration: {item.duration}</span>
          <span>Type: {item.type}</span>
        </div>

        <Link
          className="button"
          to={`/apply/${encodeURIComponent(item.id)}`}
        >
          Apply for this Internship
        </Link>
      </section>

      <section className="details-grid">
        <article className="panel">
          <h2>About the Internship</h2>
          <p>{item.description}</p>

          <h2>Responsibilities</h2>
          <ul>
            {item.responsibilities.map((task, index) => (
              <li key={index}>{task}</li>
            ))}
          </ul>
        </article>

        <aside className="panel">
          <h2>Internship Information</h2>
          <p><strong>Company:</strong> {item.company}</p>
          <p><strong>Location:</strong> {item.location}</p>
          <p><strong>Duration:</strong> {item.duration}</p>
          <p><strong>Stipend:</strong> {item.stipend}</p>
          <p><strong>Deadline:</strong> {item.deadline}</p>

          <h2>Eligibility</h2>
          <p>{item.eligibility}</p>

          <h2>Skills Required</h2>
          <div className="skills">
            {item.skills.map((skill) => (
              <span className="skill" key={skill}>{skill}</span>
            ))}
          </div>
        </aside>
      </section>

      <Link className="button" to={`/apply/${encodeURIComponent(item.id)}`}>
        Apply Now →
      </Link>
    </main>
  );
}

function ApplicationForm() {
  const { id } = useParams();

  const [items, setItems] = useState([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [internshipId, setInternshipId] = useState(id || "");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loadingItems, setLoadingItems] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    apiRequest("/api/internships")
      .then(setItems)
      .catch((err) => setError(err.message))
      .finally(() => setLoadingItems(false));
  }, []);

  useEffect(() => {
    setInternshipId(id || "");
  }, [id]);

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    setError("");

    if (
      !name.trim() ||
      !email.trim() ||
      !rollNumber.trim() ||
      !internshipId
    ) {
      setError("Please complete all required fields.");
      return;
    }

    if (name.trim().length < 2) {
      setError("Name must contain at least 2 characters.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }

    const selected = items.find(
      (item) => String(item.id) === String(internshipId)
    );

    if (!selected) {
      setError("Please select a valid internship.");
      return;
    }

    setSubmitting(true);

    try {
      const data = await apiRequest("/api/applications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          rollNumber: rollNumber.trim(),
          internshipId: selected.id,
          internshipTitle: selected.title
        })
      });

      setMessage(data.message || "Application submitted successfully!");
      setName("");
      setEmail("");
      setRollNumber("");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="container form-page">
      <Link className="back-link" to="/">
        ← Back to internships
      </Link>

      <section className="form-panel">
        <span className="eyebrow">TAKE THE NEXT STEP</span>
        <h1>Internship Application</h1>
        <p>Enter your student details and select an internship.</p>

        <form className="form" onSubmit={handleSubmit}>
          <label htmlFor="name">Student Name *</label>
          <input
            id="name"
            type="text"
            placeholder="Enter your full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            minLength={2}
            required
          />

          <label htmlFor="email">Email ID *</label>
          <input
            id="email"
            type="email"
            placeholder="Enter your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label htmlFor="rollNumber">Roll Number *</label>
          <input
            id="rollNumber"
            type="text"
            placeholder="Enter your roll number"
            value={rollNumber}
            onChange={(e) => setRollNumber(e.target.value)}
            required
          />

          <label htmlFor="internship">Select Internship *</label>
          <select
            id="internship"
            value={internshipId}
            onChange={(e) => setInternshipId(e.target.value)}
            required
            disabled={loadingItems}
          >
            <option value="">
              {loadingItems ? "Loading internships..." : "Choose an internship"}
            </option>
            {items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title}
              </option>
            ))}
          </select>

          <button type="submit" disabled={submitting || loadingItems}>
            {submitting ? "Submitting..." : "Submit Application"}
          </button>
        </form>

        {message && <p className="success" role="status">{message}</p>}
        {error && <p className="error" role="alert">{error}</p>}

        <p className="small-note">* Required fields</p>
      </section>
    </main>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<InternshipList />} />
        <Route path="/internships/:id" element={<InternshipDetails />} />
        <Route path="/apply" element={<ApplicationForm />} />
        <Route path="/apply/:id" element={<ApplicationForm />} />
      </Routes>
    </BrowserRouter>
  );
}