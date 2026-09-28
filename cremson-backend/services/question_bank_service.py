from typing import List, Dict, Any, Optional
import uuid
import copy
import os
import json

# Pilot Seed Data: Class XII Entrepreneurship Question Bank
SEED_QUESTIONS: List[Dict[str, Any]] = [
    # --- OBJECTIVE (MCQ / Assertion-Reason / True-False) --- 1 Mark Each
    {
        "id": "q-101",
        "class_name": "Class XII",
        "subject": "Entrepreneurship",
        "chapter": "Entrepreneurial Opportunity",
        "topic": "Opportunity Recognition",
        "question_type": "Objective",
        "objective_subtype": "Standard MCQ",
        "difficulty": "Easy",
        "marks": 1,
        "question_text": "Which of the following best describes an entrepreneurial opportunity?",
        "option_a": "Any idea that is personally interesting",
        "option_b": "A viable possibility of creating value by meeting a need",
        "option_c": "Any activity involving investment",
        "option_d": "A business idea copied from an existing enterprise",
        "correct_answer": "B",
        "model_answer": "Option (B) is correct. An entrepreneurial opportunity represents a viable possibility to create economic or social value by fulfilling an unmet market need.",
        "marking_scheme": "1 mark for selecting option (B).",
        "competency_type": "Understand",
        "source": "Cremson Question Bank",
        "author": "Cremson Editorial Team",
        "academic_session": "2026-27",
        "verification_status": "Approved",
        "active_status": True,
        "is_case": False
    },
    {
        "id": "q-102",
        "class_name": "Class XII",
        "subject": "Entrepreneurship",
        "chapter": "Entrepreneurial Opportunity",
        "topic": "Economic Development & Innovation",
        "question_type": "Objective",
        "objective_subtype": "Assertion-Reason",
        "difficulty": "Moderate",
        "marks": 1,
        "question_text": "Assertion (A): Entrepreneurs contribute to economic development.\nReason (R): Entrepreneurs can create employment and introduce innovative products or methods.",
        "option_a": "Both A and R are true, and R is the correct explanation of A.",
        "option_b": "Both A and R are true, but R is not the correct explanation of A.",
        "option_c": "A is true, but R is false.",
        "option_d": "A is false, but R is true.",
        "correct_answer": "A",
        "model_answer": "Option (A) is correct. Entrepreneurial activities drive employment and market innovation, which directly foster national economic growth.",
        "marking_scheme": "1 mark for option (A).",
        "competency_type": "Analyse",
        "source": "Cremson Question Bank",
        "author": "Cremson Editorial Team",
        "academic_session": "2026-27",
        "verification_status": "Approved",
        "active_status": True,
        "is_case": False
    },
    {
        "id": "q-103",
        "class_name": "Class XII",
        "subject": "Entrepreneurship",
        "chapter": "Entrepreneurial Opportunity",
        "topic": "Customer Needs",
        "question_type": "Objective",
        "objective_subtype": "Standard MCQ",
        "difficulty": "Easy",
        "marks": 1,
        "question_text": "Which one of the following is most closely associated with identifying an unmet customer need?",
        "option_a": "Opportunity recognition",
        "option_b": "Book keeping",
        "option_c": "Recruitment",
        "option_d": "Wage calculation",
        "correct_answer": "A",
        "model_answer": "Option (A) is correct. Identifying unmet customer requirements is the core aspect of opportunity recognition.",
        "marking_scheme": "1 mark for option (A).",
        "competency_type": "Remember",
        "source": "Cremson Question Bank",
        "author": "Cremson Editorial Team",
        "academic_session": "2026-27",
        "verification_status": "Approved",
        "active_status": True,
        "is_case": False
    },
    {
        "id": "q-104",
        "class_name": "Class XII",
        "subject": "Entrepreneurship",
        "chapter": "Entrepreneurial Opportunity",
        "topic": "Innovation",
        "question_type": "Objective",
        "objective_subtype": "Standard MCQ",
        "difficulty": "Easy",
        "marks": 1,
        "question_text": "An entrepreneur who introduces a new method of production is demonstrating:",
        "option_a": "Innovation",
        "option_b": "Delegation",
        "option_c": "Liquidation",
        "option_d": "Supervision",
        "correct_answer": "A",
        "model_answer": "Option (A) is correct. Introducing new production processes or novel approaches is defined as innovation.",
        "marking_scheme": "1 mark for option (A).",
        "competency_type": "Understand",
        "source": "Cremson Question Bank",
        "author": "Cremson Editorial Team",
        "academic_session": "2026-27",
        "verification_status": "Approved",
        "active_status": True,
        "is_case": False
    },
    {
        "id": "q-105",
        "class_name": "Class XII",
        "subject": "Entrepreneurship",
        "chapter": "Entrepreneurial Opportunity",
        "topic": "Commercial Viability",
        "question_type": "Objective",
        "objective_subtype": "Fill in the Blank",
        "difficulty": "Easy",
        "marks": 1,
        "question_text": "A business opportunity should be assessed for its commercial viability before resources are committed.",
        "option_a": "True",
        "option_b": "False",
        "option_c": "",
        "option_d": "",
        "correct_answer": "A",
        "model_answer": "Option (A) True. Commercial viability evaluation is critical prior to capital investment.",
        "marking_scheme": "1 mark for True.",
        "competency_type": "Apply",
        "source": "Cremson Question Bank",
        "author": "Cremson Editorial Team",
        "academic_session": "2026-27",
        "verification_status": "Approved",
        "active_status": True,
        "is_case": False
    },
    {
        "id": "q-106",
        "class_name": "Class XII",
        "subject": "Entrepreneurship",
        "chapter": "Business Planning",
        "topic": "Feasibility Study",
        "question_type": "Objective",
        "objective_subtype": "Standard MCQ",
        "difficulty": "Moderate",
        "marks": 1,
        "question_text": "Which analysis evaluates whether the technical requirements of a business idea can be realistically fulfilled?",
        "option_a": "Financial Feasibility",
        "option_b": "Technical Feasibility",
        "option_c": "Market Feasibility",
        "option_d": "Legal Feasibility",
        "correct_answer": "B",
        "model_answer": "Option (B) Technical Feasibility.",
        "marking_scheme": "1 mark for option (B).",
        "competency_type": "Understand",
        "source": "Cremson Question Bank",
        "author": "Cremson Editorial Team",
        "academic_session": "2026-27",
        "verification_status": "Approved",
        "active_status": True,
        "is_case": False
    },

    # --- VERY SHORT ANSWER QUESTIONS --- 2 Marks Each
    {
        "id": "q-201",
        "class_name": "Class XII",
        "subject": "Entrepreneurship",
        "chapter": "Entrepreneurial Opportunity",
        "topic": "Entrepreneur Characteristics",
        "question_type": "Very Short Answer",
        "objective_subtype": None,
        "difficulty": "Easy",
        "marks": 2,
        "question_text": "State any two characteristics of a successful entrepreneur.",
        "model_answer": "Two key characteristics are:\n1. Risk-taking ability: Willingness to accept calculated uncertainties.\n2. Innovation: Constantly seeking new methods or products to create value.",
        "marking_scheme": "1 mark for each valid characteristic correctly stated (1 + 1 = 2 Marks).",
        "competency_type": "Remember",
        "source": "Cremson Question Bank",
        "author": "Cremson Editorial Team",
        "academic_session": "2026-27",
        "verification_status": "Approved",
        "active_status": True,
        "is_case": False
    },
    {
        "id": "q-202",
        "class_name": "Class XII",
        "subject": "Entrepreneurship",
        "chapter": "Entrepreneurial Opportunity",
        "topic": "Idea vs Opportunity",
        "question_type": "Very Short Answer",
        "objective_subtype": None,
        "difficulty": "Moderate",
        "marks": 2,
        "question_text": "Differentiate between a business idea and a business opportunity on any two bases.",
        "model_answer": "1. Commercial Viability: An idea is a basic thought without tested profitability; an opportunity is a commercially viable idea.\n2. Market Need: An idea may or may not solve a customer problem, whereas an opportunity fulfills a proven market demand.",
        "marking_scheme": "1 mark per distinction point (1 + 1 = 2 Marks).",
        "competency_type": "Analyse",
        "source": "Cremson Question Bank",
        "author": "Cremson Editorial Team",
        "academic_session": "2026-27",
        "verification_status": "Approved",
        "active_status": True,
        "is_case": False
    },
    {
        "id": "q-203",
        "class_name": "Class XII",
        "subject": "Entrepreneurship",
        "chapter": "Entrepreneurial Opportunity",
        "topic": "Sources of Opportunity",
        "question_type": "Very Short Answer",
        "objective_subtype": None,
        "difficulty": "Easy",
        "marks": 2,
        "question_text": "Mention any two sources from which an entrepreneur may identify an opportunity.",
        "model_answer": "1. Observing market trends and consumer feedback.\n2. Technological advancements and changes in government policies.",
        "marking_scheme": "1 mark for mentioning each valid source (1 + 1 = 2 Marks).",
        "competency_type": "Remember",
        "source": "Cremson Question Bank",
        "author": "Cremson Editorial Team",
        "academic_session": "2026-27",
        "verification_status": "Approved",
        "active_status": True,
        "is_case": False
    },
    {
        "id": "q-204",
        "class_name": "Class XII",
        "subject": "Entrepreneurship",
        "chapter": "Enterprise Marketing",
        "topic": "Target Market",
        "question_type": "Very Short Answer",
        "objective_subtype": None,
        "difficulty": "Moderate",
        "marks": 2,
        "question_text": "What is meant by a 'Target Market' for a new business enterprise?",
        "model_answer": "A target market refers to a specific, well-defined group of consumers at which a company aims its products and marketing services.",
        "marking_scheme": "2 marks for clear definition.",
        "competency_type": "Understand",
        "source": "Cremson Question Bank",
        "author": "Cremson Editorial Team",
        "academic_session": "2026-27",
        "verification_status": "Approved",
        "active_status": True,
        "is_case": False
    },

    # --- SHORT ANSWER QUESTIONS --- 3 Marks Each
    {
        "id": "q-301",
        "class_name": "Class XII",
        "subject": "Entrepreneurship",
        "chapter": "Entrepreneurial Opportunity",
        "topic": "Entrepreneurial Functions",
        "question_type": "Short Answer",
        "objective_subtype": None,
        "difficulty": "Moderate",
        "marks": 3,
        "question_text": "Explain any three functions performed by an entrepreneur.",
        "model_answer": "1. Opportunity Identification: Spotting unmet market needs.\n2. Resource Mobilisation: Assembling capital, human talent, and physical assets.\n3. Risk Taking: Bearing financial and operational uncertainties of the venture.",
        "marking_scheme": "1 mark for explaining each function clearly (1 x 3 = 3 Marks).",
        "competency_type": "Understand",
        "source": "Cremson Question Bank",
        "author": "Cremson Editorial Team",
        "academic_session": "2026-27",
        "verification_status": "Approved",
        "active_status": True,
        "is_case": False
    },
    {
        "id": "q-302",
        "class_name": "Class XII",
        "subject": "Entrepreneurship",
        "chapter": "Entrepreneurial Opportunity",
        "topic": "Evaluating Opportunities",
        "question_type": "Short Answer",
        "objective_subtype": None,
        "difficulty": "Moderate",
        "marks": 3,
        "question_text": "Explain any three factors that should be considered while evaluating a business opportunity.",
        "model_answer": "1. Market Demand: Presence of sufficient potential buyers.\n2. Technical & Commercial Viability: Feasibility of producing and pricing profitably.\n3. Resource Availability: Access to required raw materials, skills, and funding.",
        "marking_scheme": "1 mark per factor explanation (1 x 3 = 3 Marks).",
        "competency_type": "Apply",
        "source": "Cremson Question Bank",
        "author": "Cremson Editorial Team",
        "academic_session": "2026-27",
        "verification_status": "Approved",
        "active_status": True,
        "is_case": False
    },
    {
        "id": "q-303",
        "class_name": "Class XII",
        "subject": "Entrepreneurship",
        "chapter": "Entrepreneurial Opportunity",
        "topic": "Importance of Innovation",
        "question_type": "Short Answer",
        "objective_subtype": None,
        "difficulty": "Moderate",
        "marks": 3,
        "question_text": "Explain the importance of innovation for an entrepreneurial venture.",
        "model_answer": "Innovation creates competitive advantage, reduces operational costs through efficient methods, and allows ventures to meet evolving customer needs effectively.",
        "marking_scheme": "1 mark per relevant point explained (3 marks total).",
        "competency_type": "Analyse",
        "source": "Cremson Question Bank",
        "author": "Cremson Editorial Team",
        "academic_session": "2026-27",
        "verification_status": "Approved",
        "active_status": True,
        "is_case": False
    },
    {
        "id": "q-303-alt",
        "class_name": "Class XII",
        "subject": "Entrepreneurship",
        "chapter": "Entrepreneurial Opportunity",
        "topic": "Customer Needs & Opportunity",
        "question_type": "Short Answer",
        "objective_subtype": None,
        "difficulty": "Moderate",
        "marks": 3,
        "question_text": "Explain how customer needs can help an entrepreneur identify a business opportunity.",
        "model_answer": "Customer needs point out gaps in existing market offerings. By observing customer complaints or unsatisfied desires, entrepreneurs can design solutions that offer genuine utility and command market demand.",
        "marking_scheme": "3 marks for logical explanation focusing on market gaps and customer utility.",
        "competency_type": "Understand",
        "source": "Cremson Question Bank",
        "author": "Cremson Editorial Team",
        "academic_session": "2026-27",
        "verification_status": "Approved",
        "active_status": True,
        "is_case": False
    },

    # --- LONG ANSWER QUESTIONS --- 5 Marks Each
    {
        "id": "q-401",
        "class_name": "Class XII",
        "subject": "Entrepreneurship",
        "chapter": "Entrepreneurial Opportunity",
        "topic": "Opportunity Assessment Process",
        "question_type": "Long Answer",
        "objective_subtype": None,
        "difficulty": "Challenging",
        "marks": 5,
        "question_text": "Explain the process an entrepreneur may follow from identifying a business idea to assessing whether it is a viable business opportunity.",
        "model_answer": "The step-by-step process includes:\n1. Idea Generation & Scanning: Brainstorming and monitoring environmental signals.\n2. Customer Need Assessment: Validating whether people face the problem.\n3. Market Research: Measuring market size, competition, and growth.\n4. Financial & Technical Feasibility: Estimating cost structures, prices, and break-even points.\n5. Viability Verification: Deciding to proceed based on expected ROI and sustainability.",
        "marking_scheme": "1 mark for each clearly explained sequential stage (5 Marks total).",
        "competency_type": "Analyse",
        "source": "Cremson Question Bank",
        "author": "Cremson Editorial Team",
        "academic_session": "2026-27",
        "verification_status": "Approved",
        "active_status": True,
        "is_case": False
    },
    {
        "id": "q-402",
        "class_name": "Class XII",
        "subject": "Entrepreneurship",
        "chapter": "Business Planning",
        "topic": "Components of Business Plan",
        "question_type": "Long Answer",
        "objective_subtype": None,
        "difficulty": "Challenging",
        "marks": 5,
        "question_text": "Elaborate on the key components of a comprehensive Business Plan.",
        "model_answer": "A comprehensive business plan consists of:\n1. Executive Summary\n2. Enterprise Description\n3. Market & Industry Analysis\n4. Operational Plan\n5. Financial Projections",
        "marking_scheme": "1 mark per component with concise explanation (5 Marks total).",
        "competency_type": "Understand",
        "source": "Cremson Question Bank",
        "author": "Cremson Editorial Team",
        "academic_session": "2026-27",
        "verification_status": "Approved",
        "active_status": True,
        "is_case": False
    },

    # --- CASE-BASED QUESTIONS --- 5 Marks Total (Parent Case + Sub-Questions)
    {
        "id": "q-501",
        "class_name": "Class XII",
        "subject": "Entrepreneurship",
        "chapter": "Entrepreneurial Opportunity",
        "topic": "Case Study on Opportunity Validation",
        "question_type": "Case-Based",
        "objective_subtype": None,
        "difficulty": "Moderate",
        "marks": 5,
        "question_text": "Read the following case carefully:\nRiya noticed that many students in her locality wanted affordable, healthy snacks during evening tuition classes. She observed existing options, spoke to students and parents, and found that customers were willing to pay for hygienically packed snacks delivered at a convenient time. She then compared suppliers, costs and possible selling prices before deciding whether the idea could become a sustainable venture.",
        "case_passage": "Riya noticed that many students in her locality wanted affordable, healthy snacks during evening tuition classes. She observed existing options, spoke to students and parents, and found that customers were willing to pay for hygienically packed snacks delivered at a convenient time. She then compared suppliers, costs and possible selling prices before deciding whether the idea could become a sustainable venture.",
        "sub_questions": [
            {
                "sub_id": "13a",
                "label": "13(a)",
                "question_text": "Which entrepreneurial activity is illustrated by Riya's observation of an unmet customer need?",
                "marks": 1,
                "model_answer": "Opportunity recognition / identification of a customer need.",
                "marking_scheme": "1 mark for correctly identifying Opportunity Recognition."
            },
            {
                "sub_id": "13b",
                "label": "13(b)",
                "question_text": "Why is speaking to potential customers useful before starting the venture?",
                "marks": 2,
                "model_answer": "It helps validate the need, understand customer expectations, and assess willingness to pay.",
                "marking_scheme": "2 marks for explaining demand validation and pricing feedback."
            },
            {
                "sub_id": "13c",
                "label": "13(c)",
                "question_text": "Why should Riya assess costs, suppliers and selling price before committing resources?",
                "marks": 2,
                "model_answer": "It helps determine commercial viability, likely profit margins, and long-term venture sustainability.",
                "marking_scheme": "2 marks for cost-viability explanation."
            }
        ],
        "model_answer": "13(a) Opportunity recognition.\n13(b) Customer validation.\n13(c) Commercial feasibility.",
        "marking_scheme": "Sub-question 13(a): 1 mark; 13(b): 2 marks; 13(c): 2 marks (5 Marks Total).",
        "competency_type": "Apply",
        "source": "Cremson Question Bank",
        "author": "Cremson Editorial Team",
        "academic_session": "2026-27",
        "verification_status": "Approved",
        "active_status": True,
        "is_case": True
    }
]

class QuestionBankService:
    def __init__(self):
        self._questions = copy.deepcopy(SEED_QUESTIONS)
        self.table_id = os.getenv("TABLE_QUESTION_BANK")
        self.baserow_url = os.getenv("BASEROW_URL", "https://baserow.cremsonpublications.com")
        self.baserow_token = os.getenv("BASEROW_TOKEN", "HkWj6pCpBqAxEeFqyGDDQOqr92m3iauI")
        self._load_from_baserow()

    def _load_from_baserow(self):
        if not self.table_id:
            return
        try:
            import requests
            headers = {"Authorization": f"Token {self.baserow_token}"}
            url = f"{self.baserow_url}/api/database/rows/table/{self.table_id}/?user_field_names=true&size=200"
            res = requests.get(url, headers=headers, timeout=5)
            if res.status_code == 200:
                rows = res.json().get("results", [])
                loaded = []
                for r in rows:
                    if not r.get("question_text"):
                        continue
                    sub_q = []
                    if r.get("sub_questions_json"):
                        try:
                            sub_q = json.loads(r.get("sub_questions_json"))
                        except Exception:
                            sub_q = []
                    loaded.append({
                        "id": f"br-{r['id']}",
                        "baserow_row_id": r["id"],
                        "class_name": r.get("class_name") or "Class XII",
                        "subject": r.get("subject") or "Entrepreneurship",
                        "chapter": r.get("chapter") or "",
                        "topic": r.get("topic") or "",
                        "question_type": r.get("question_type") or "Objective",
                        "objective_subtype": r.get("objective_subtype"),
                        "difficulty": r.get("difficulty") or "Easy",
                        "marks": int(r.get("marks") or 1),
                        "question_text": r.get("question_text") or "",
                        "option_a": r.get("option_a") or "",
                        "option_b": r.get("option_b") or "",
                        "option_c": r.get("option_c") or "",
                        "option_d": r.get("option_d") or "",
                        "correct_answer": r.get("correct_answer") or "",
                        "model_answer": r.get("model_answer") or "",
                        "marking_scheme": r.get("marking_scheme") or "",
                        "competency_type": r.get("competency_type") or "Understand",
                        "source": r.get("source") or "Cremson Question Bank",
                        "verification_status": r.get("verification_status") or "Approved",
                        "active_status": bool(r.get("active_status", True)),
                        "is_case": bool(r.get("is_case", False)),
                        "sub_questions": sub_q
                    })
                if loaded:
                    self._questions = loaded
        except Exception as err:
            print(f"[QuestionBankService] Failed to load from Baserow: {err}")

    def get_meta(self) -> Dict[str, Any]:
        """Return available metadata for dropdowns."""
        self._load_from_baserow()
        classes = sorted(list({q["class_name"] for q in self._questions if q.get("class_name")}))
        subjects = sorted(list({q["subject"] for q in self._questions if q.get("subject")}))
        chapters = sorted(list({q["chapter"] for q in self._questions if q.get("chapter")}))
        question_types = ["Objective", "Very Short Answer", "Short Answer", "Long Answer", "Case-Based"]
        return {
            "classes": classes or ["Class XII"],
            "subjects": subjects or ["Entrepreneurship"],
            "chapters": chapters or ["Entrepreneurial Opportunity", "Business Planning", "Enterprise Marketing"],
            "question_types": question_types,
            "difficulties": ["Easy", "Balanced", "Challenging"]
        }

    def list_questions(
        self,
        class_name: Optional[str] = None,
        subject: Optional[str] = None,
        chapter: Optional[str] = None,
        question_type: Optional[str] = None,
        difficulty: Optional[str] = None,
        search: Optional[str] = None,
        approved_only: bool = True
    ) -> List[Dict[str, Any]]:
        self._load_from_baserow()
        results = []
        for q in self._questions:
            if approved_only and (q.get("verification_status") != "Approved" or not q.get("active_status", True)):
                continue
            if class_name and q.get("class_name") != class_name:
                continue
            if subject and q.get("subject") != subject:
                continue
            if chapter and q.get("chapter") != chapter:
                continue
            if question_type and q.get("question_type") != question_type:
                continue
            if difficulty and difficulty != "Balanced" and q.get("difficulty") != difficulty:
                continue
            if search:
                term = search.lower()
                q_text = (q.get("question_text") or "").lower()
                chap = (q.get("chapter") or "").lower()
                if term not in q_text and term not in chap:
                    continue
            results.append(q)
        return results

    def get_question_by_id(self, question_id: str) -> Optional[Dict[str, Any]]:
        self._load_from_baserow()
        for q in self._questions:
            if q["id"] == question_id:
                return copy.deepcopy(q)
        return None

    def add_question(self, data: Dict[str, Any]) -> Dict[str, Any]:
        q_id = f"q-{uuid.uuid4().hex[:6]}"
        data["id"] = q_id
        data.setdefault("verification_status", "Approved")
        data.setdefault("active_status", True)
        
        # Save to Baserow if table exists
        if self.table_id:
            try:
                import requests
                headers = {"Authorization": f"Token {self.baserow_token}", "Content-Type": "application/json"}
                url = f"{self.baserow_url}/api/database/rows/table/{self.table_id}/?user_field_names=true"
                payload = {
                    "class_name": data.get("class_name", "Class XII"),
                    "subject": data.get("subject", "Entrepreneurship"),
                    "chapter": data.get("chapter", ""),
                    "topic": data.get("topic", ""),
                    "question_type": data.get("question_type", "Objective"),
                    "difficulty": data.get("difficulty", "Easy"),
                    "marks": int(data.get("marks", 1)),
                    "question_text": data.get("question_text", ""),
                    "option_a": data.get("option_a", ""),
                    "option_b": data.get("option_b", ""),
                    "option_c": data.get("option_c", ""),
                    "option_d": data.get("option_d", ""),
                    "correct_answer": data.get("correct_answer", ""),
                    "model_answer": data.get("model_answer", ""),
                    "marking_scheme": data.get("marking_scheme", ""),
                    "competency_type": data.get("competency_type", "Understand"),
                    "source": data.get("source", "Cremson Question Bank"),
                    "verification_status": data.get("verification_status", "Approved"),
                    "active_status": True,
                    "is_case": data.get("is_case", False),
                    "sub_questions_json": json.dumps(data.get("sub_questions", [])) if data.get("sub_questions") else ""
                }
                res = requests.post(url, headers=headers, json=payload, timeout=5)
                if res.status_code in (200, 201):
                    row_data = res.json()
                    data["baserow_row_id"] = row_data["id"]
                    data["id"] = f"br-{row_data['id']}"
            except Exception as err:
                print(f"[QuestionBankService] Failed to post row to Baserow: {err}")

        self._questions.append(data)
        return data

    def update_question(self, question_id: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        for idx, q in enumerate(self._questions):
            if q["id"] == question_id:
                updated = {**q, **data, "id": question_id}
                self._questions[idx] = updated
                return updated
        return None

    def generate_paper(self, req: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generates a paper based on setup and blueprint.
        req structure:
        {
          "class_name": "Class XII",
          "subject": "Entrepreneurship",
          "chapters": ["Entrepreneurial Opportunity"],
          "difficulty": "Balanced",
          "max_marks": 30,
          "blueprint": [
             {"question_type": "Objective", "quantity": 5, "marks_each": 1},
             {"question_type": "Very Short Answer", "quantity": 3, "marks_each": 2},
             {"question_type": "Short Answer", "quantity": 3, "marks_each": 3},
             {"question_type": "Long Answer", "quantity": 1, "marks_each": 5},
             {"question_type": "Case-Based", "quantity": 1, "marks_each": 5}
          ]
        }
        """
        selected_questions = []
        warnings = []

        pool = self.list_questions(
            class_name=req.get("class_name"),
            subject=req.get("subject"),
            approved_only=True
        )
        
        # Filter by selected chapters if provided
        chapters = req.get("chapters", [])
        if chapters:
            pool = [q for q in pool if q.get("chapter") in chapters]

        used_ids = set()

        for item in req.get("blueprint", []):
            q_type = item["question_type"]
            qty = item["quantity"]
            marks_each = item.get("marks_each", 1)

            if qty <= 0:
                continue

            matching = [
                q for q in pool
                if q["id"] not in used_ids
                and q["question_type"] == q_type
                and q["marks"] == marks_each
            ]

            if len(matching) < qty:
                # If exact chapter match falls short, try matching across subject
                backup_matching = [
                    q for q in self.list_questions(
                        class_name=req.get("class_name"),
                        subject=req.get("subject"),
                        approved_only=True
                    )
                    if q["id"] not in used_ids
                    and q["question_type"] == q_type
                    and q["marks"] == marks_each
                ]
                matching = backup_matching

            if len(matching) < qty:
                warnings.append(
                    f"Not enough approved '{q_type}' questions ({marks_each} marks). Requested {qty}, found {len(matching)}."
                )

            chosen = matching[:qty]
            for q in chosen:
                used_ids.add(q["id"])
                selected_questions.append(q)

        return {
            "questions": selected_questions,
            "warnings": warnings,
            "total_selected_marks": sum(q["marks"] for q in selected_questions),
            "target_marks": req.get("max_marks", 30)
        }

    def replace_question(self, current_question_id: str, chapter: str, question_type: str, marks: int) -> Optional[Dict[str, Any]]:
        pool = self.list_questions(approved_only=True)
        candidates = [
            q for q in pool
            if q["id"] != current_question_id
            and q["question_type"] == question_type
            and q["marks"] == marks
        ]
        # Prefer same chapter
        same_chap = [q for q in candidates if q.get("chapter") == chapter]
        if same_chap:
            return copy.deepcopy(same_chap[0])
        elif candidates:
            return copy.deepcopy(candidates[0])
        return None

# Singleton instance
question_bank_service = QuestionBankService()
