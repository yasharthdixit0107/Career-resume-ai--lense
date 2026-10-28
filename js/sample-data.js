// Comprehensive sample profiles with real-world resume text and job descriptions
const SAMPLE_PROFILES = {
  fullstack: {
    id: "fullstack",
    title: "Senior Full-Stack Engineer",
    company: "Stripe / FinTech Scale-Up",
    resume: `ALEX RIVERA
San Francisco, CA | (555) 234-5678 | alex.rivera@email.com | linkedin.com/in/alexrivera-dev | github.com/alexrivera

PROFESSIONAL SUMMARY
Results-driven Senior Full-Stack Engineer with 6+ years of experience designing, scaling, and maintaining high-throughput cloud web applications. Expert in TypeScript, React, Node.js, and distributed PostgreSQL architectures. Proven track record reducing API latency by 42% and architecting resilient microservices handling 15M+ daily requests.

CORE COMPETENCIES
• Languages: JavaScript (ES6+), TypeScript, Python, SQL, HTML5, CSS3/SASS
• Frontend: React, Next.js, Redux Toolkit, Tailwind CSS, Webpack, Responsive Design, WebSockets
• Backend & APIs: Node.js, Express, FastAPI, GraphQL, RESTful APIs, Microservices, gRPC
• Databases & Caching: PostgreSQL, Redis, MongoDB, Prisma ORM, Elasticsearch
• Cloud & DevOps: AWS (EC2, S3, Lambda, ECS), Docker, Kubernetes, CI/CD (GitHub Actions), Terraform
• Testing & Practices: Jest, Cypress, TDD, Agile/Scrum, System Design, Git, Code Reviews

PROFESSIONAL EXPERIENCE
Senior Full-Stack Developer | FinTech Cloud Solutions, SF
March 2022 – Present
• Architected core payments orchestration microservice using Node.js, TypeScript, and PostgreSQL, processing $25M+ monthly transactions with 99.99% uptime.
• Spearheaded frontend migration to Next.js and Tailwind CSS, slashing page load times by 48% and boosting SEO engagement scores by 35%.
• Integrated Redis distributed caching layer, reducing database read load by 60% and cutting 95th-percentile API response time from 380ms to 95ms.
• Mentored 5 junior and mid-level engineers, implemented strict TypeScript linting and CI/CD automated testing pipelines that caught 120+ pre-release bugs.

Full-Stack Software Engineer | Nexus Interactive, Austin, TX
July 2019 – February 2022
• Developed real-time analytics dashboard in React and Redux with WebSockets, delivering sub-second live metrics to 40,000 active business users.
• Built RESTful APIs using Python (FastAPI) and PostgreSQL, handling over 5 million incoming telemetry requests daily.
• Containerized 8 legacy services using Docker and configured AWS ECS deployment workflows, reducing cloud hosting costs by 22%.
• Collaborated closely with product managers and UX designers to iterate quickly using 2-week Agile sprints.

EDUCATION
B.S. in Computer Science | University of Texas at Austin (2015 – 2019)
Dean's Honor List | Coursework: Distributed Systems, Algorithms, Database Management

CERTIFICATIONS
• AWS Certified Solutions Architect – Associate (2023)
• Certified Kubernetes Application Developer (CKAD)`,

    jobDescription: `Job Title: Senior Full-Stack Engineer (Platform & Payments)
Company: ApexPay Technologies
Location: San Francisco, CA (Hybrid / Remote)

About ApexPay:
ApexPay is building the next-generation global financial infrastructure for modern digital commerce. We process billions in transactions each year for top global platforms.

Role Overview:
We are seeking an experienced Senior Full-Stack Engineer to lead the architecture and development of our mission-critical payment processing portal and merchant dashboards.

Key Responsibilities:
• Design, implement, and maintain scalable full-stack web applications and microservices using React, TypeScript, Node.js, and PostgreSQL.
• Build real-time merchant reporting interfaces and high-performance checkout flows.
• Partner with product management, security, and infrastructure teams to ensure seamless cloud deployment on AWS and Kubernetes.
• Optimize application performance, API throughput, and database queries for maximum resilience.
• Drive engineering excellence through code reviews, automated unit/integration testing (Jest, Cypress), and continuous integration (CI/CD).
• Champion high reliability, PCI-DSS compliance, and zero-downtime deployments.

Requirements & Qualifications:
• 5+ years of production experience in full-stack web development.
• Strong mastery of TypeScript, JavaScript, modern React, and Node.js.
• Deep experience with relational databases (PostgreSQL or MySQL) and caching systems (Redis).
• Hands-on familiarity with Docker, Kubernetes, and AWS cloud primitives (ECS, S3, RDS, Lambda).
• Proven background architecting RESTful APIs and GraphQL services with high reliability.
• Understanding of automated testing frameworks (Jest, Cypress, Playwright) and CI/CD pipelines.
• Excellent communication skills and ability to mentor junior team members.
• Bonus: Experience with FinTech, payment gateways (Stripe, Adyen), or distributed transaction processing.`
  },

  aiEngineer: {
    id: "aiEngineer",
    title: "AI / Machine Learning Engineer",
    company: "Autonomous AI Lab",
    resume: `ELENA VASSILIEV
Seattle, WA | (555) 789-0123 | elena.vassiliev@email.com | github.com/evassiliev-ai

SUMMARY
Senior AI / Machine Learning Engineer with 5+ years of industry experience developing and deploying Large Language Model (LLM) pipelines, NLP architectures, and computer vision systems. Expertise in PyTorch, Python, LangChain, vector databases, and scalable inference infrastructure on AWS.

TECHNICAL SKILLS
• Core: Python, C++, SQL, Bash, R
• Machine Learning & Deep Learning: PyTorch, TensorFlow, Hugging Face Transformers, scikit-learn, XGBoost
• GenAI & LLMs: LangChain, LlamaIndex, RAG pipelines, Fine-tuning (LoRA, QLoRA), OpenAI API, Anthropic API, vLLM
• Data & Vector DBs: Pinecone, Qdrant, Chroma, PostgreSQL (pgvector), Apache Spark, Pandas, NumPy
• MLOps & Cloud: AWS (SageMaker, EC2, S3), MLflow, Docker, Kubernetes, Ray, Triton Inference Server, Git

WORK EXPERIENCE
Lead AI Engineer | SynthAI Corp, Seattle, WA
Jan 2023 – Present
• Designed an enterprise Retrieval-Augmented Generation (RAG) platform serving 120k queries/day with 94% retrieval accuracy using LangChain, Pinecone, and Claude 3.5 Sonnet.
• Fine-tuned open-source Llama 3 models using LoRA and QLoRA on custom domain datasets, achieving 28% higher task accuracy than base model while cutting inference cost by 65%.
• Deployed low-latency LLM serving with vLLM and Ray on AWS SageMaker multi-GPU clusters, maintaining p99 latency under 220ms.

Machine Learning Engineer | DataVision Systems, San Francisco, CA
June 2020 – Dec 2022
• Built end-to-end NLP document classification pipeline processing 2M+ legal documents with 96.2% F1-score using Hugging Face transformers.
• Built MLflow automated experiment tracking and model registry, standardizing model validation across 14 engineers.

EDUCATION
M.S. in Artificial Intelligence & Robotics | University of Washington (2018 – 2020)
B.S. in Applied Mathematics | UC Berkeley (2014 – 2018)`,

    jobDescription: `Job Title: Senior Machine Learning Engineer (Generative AI & LLMs)
Company: Cognition Matrix
Location: Seattle, WA / Remote

We are looking for a Senior Machine Learning Engineer to spearhead our Generative AI product line. You will build cutting-edge RAG systems, multimodal AI assistants, and enterprise agentic workflows.

Responsibilities:
• Architect scalable LLM applications and agentic workflows using Python, PyTorch, LangChain, and modern vector databases (Pinecone, Weaviate, pgvector).
• Fine-tune domain-specific foundational models using parameter-efficient fine-tuning (PEFT, LoRA).
• Build robust production evaluation benchmarks (evals) to measure hallucination rates and semantic relevance.
• Implement scalable inference serving using vLLM, Triton, Docker, and Kubernetes on AWS or GCP.
• Collaborate with backend engineers to integrate AI models into REST and gRPC microservices.

Requirements:
• 4+ years of machine learning engineering experience in production.
• Deep expertise in Python, PyTorch, Hugging Face, and Transformer architectures.
• Hands-on production experience with LangChain or LlamaIndex and vector databases.
• Strong understanding of MLOps best practices (MLflow, Docker, CI/CD, GPU orchestration).
• Familiarity with Prompt Engineering, RAG optimization, and embedding models.
• Master’s degree or equivalent practical experience in Computer Science or related quantitative field.`
  },

  productManager: {
    id: "productManager",
    title: "Senior Technical Product Manager",
    company: "SaaS Enterprise Platforms",
    resume: `JORDAN CHEN
New York, NY | (555) 456-7890 | jordan.chen@email.com | linkedin.com/in/jordanchen-pm

EXECUTIVE SUMMARY
Strategic and metric-driven Senior Technical Product Manager with 7+ years of experience steering B2B SaaS products from 0-to-1 and scaling to $30M ARR. Adept in product strategy, user discovery, agile product roadmapping, data analytics (SQL, Mixpanel), and developer platform APIs.

KEY SKILLS
• Product Strategy: Product Roadmap, Go-To-Market (GTM), PRDs, User Story Mapping, OKRs, Market Research
• Agile & Delivery: Scrum, Kanban, JIRA, Linear, Sprint Planning, Backlog Prioritization, A/B Testing
• Technical & Data: SQL, Postman, REST API Design, Mixpanel, Amplitude, Tableau, Google Analytics, Figma
• Collaboration: Cross-Functional Leadership, Executive Presentations, Customer Interviews, Stakeholder Management

PROFESSIONAL EXPERIENCE
Senior Product Manager | CloudStream B2B, New York, NY
August 2021 – Present
• Led product strategy for developer-facing API platform, driving product adoption from 1,200 to 8,500 enterprise customers and growing platform ARR by 180% ($12M to $33M).
• Conducted 100+ user interviews to identify onboarding bottlenecks, resulting in a streamlined quickstart workflow that cut customer time-to-first-API-call from 4 days to 18 minutes.
• Defined OKRs and managed cross-functional squads of 12 engineers, 2 UX designers, and technical writers across 26 continuous sprint cycles.
• Built self-serve analytics dashboards in Amplitude and SQL to monitor cohort retention, leading to feature changes that dropped churn by 3.8%.

Product Manager | Omnichannel Media, Boston, MA
June 2018 – July 2021
• Managed consumer analytics portal through 3 major version releases, delivering 45% YoY growth in Daily Active Users (DAU).
• Instituted data-driven feature scoring matrix (RICE framework) to streamline backlog prioritization across 5 internal stakeholder teams.
• Authored comprehensive PRDs, wireframes in Figma, and release documentation for 22 customer-facing features.

EDUCATION
B.A. in Economics & Information Science | Cornell University, Ithaca, NY
Certifications: Pragmatic Institute Certified (PMC-III), Certified Scrum Product Owner (CSPO)`,

    jobDescription: `Job Title: Senior Technical Product Manager - Developer Platform
Company: DataSphere Global
Location: New York, NY (Hybrid)

About DataSphere:
DataSphere is the enterprise data streaming backbone for Fortune 500 companies.

Role Overview:
We are looking for a Senior Technical Product Manager to oversee our Core APIs, SDKs, and Developer Experience. You will own the developer journey from documentation to enterprise production deployment.

Key Responsibilities:
• Own the multi-year product roadmap and vision for DataSphere's developer platform and public APIs.
• Author meticulous Product Requirement Documents (PRDs), user stories, and architectural specifications in close partnership with Engineering.
• Work directly with enterprise CTOs and lead architects to uncover developer pain points and translate them into actionable product requirements.
• Define, monitor, and report key platform metrics including API adoption, developer conversion, Time-to-First-Call (TTFC), and customer retention.
• Drive cross-functional alignment across Engineering, Design, Developer Relations, Marketing, and Sales.
• Lead agile ceremonies: sprint planning, backlog grooming, retrospectives, and customer beta testing programs.

Qualifications:
• 5+ years of product management experience building B2B SaaS, developer tools, or cloud infrastructure platforms.
• Strong technical background with understanding of REST APIs, webhooks, cloud architectures, and developer workflows.
• Proficiency in SQL, product analytics tools (Mixpanel, Amplitude), and project management software (Jira, Linear).
• Proven track record launching successful software products that achieve measurable commercial impact.
• Exceptional written and verbal communication skills; comfortable presenting to C-suite stakeholders.`
  }
};

// Export to window
if (typeof window !== 'undefined') {
  window.SAMPLE_PROFILES = SAMPLE_PROFILES;
}
