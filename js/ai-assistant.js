/**
 * ==========================================================================
 * INTERACT IA ASSISTANT (GOOGLE GEMINI 3.6 FLASH)
 * Official Interactive Assistant for Interact Club members and leaders.
 * ==========================================================================
 */

class AIAssistantManager {
  constructor() {
    this.messagesContainer = null;
    this.inputField = null;
    this.apiKey = this.loadApiKey();
    this.modelName = "gemini-3.6-flash";
    this.chatHistory = [];
    this.systemInstruction = `Tu es l'Assistant IA officiel d'Interact (Rotary International). Ton rôle est d'accompagner les membres, recrues et dirigeants d'Interact :
1. FICHES DE POSTES : Expliquer en détail les rôles, traditions et responsabilités (Président, Vice-Président, Secrétaire, Responsable Protocole, Trésorier, Chefs de Commission, Représentant aux Séminaires).
2. LETTRES DE MOTIVATION : Rédiger, corriger et peaufiner des lettres de motivation percutantes pour postuler au Bureau ou aux commissions/comités de séminaire.
3. DOCUMENTS STATUTAIRES : Aider à la rédaction de comptes-rendus de réunions statutaires, dossiers de sponsoring, demandes d'autorisations et plans d'action détaillés.
4. IDÉES D'ACTIONS : Proposer des concepts originaux et réalisables d'actions d'intérêt public (sociales, culturelles, environnementales, levées de fonds, développement des compétences).

Règles de style :
- Adopte un ton bienveillant, professionnel, dynamique et inspirant, reflétant la devise 'Servir d'abord' (Service Above Self) et les 4 questions du Rotary.
- Formate clairement tes réponses avec du Markdown (titres avec ###, listes à puces claires, texte en gras pour les points essentiels).`;
  }

  loadApiKey() {
    const customKey = localStorage.getItem('interact_gemini_custom_key');
    if (customKey && customKey.trim()) return customKey.trim();
    // Default key placeholder: configured via Settings tab or local storage
    return window.GEMINI_API_KEY || "";
  }

  saveApiKey(key) {
    this.apiKey = key.trim();
    localStorage.setItem('interact_gemini_custom_key', this.apiKey);
  }

  init() {
    this.messagesContainer = document.getElementById('ai-chat-messages');
    this.inputField = document.getElementById('ai-chat-input');

    // Welcome initial message
    if (this.chatHistory.length === 0) {
      this.addMessage(
        `Bonjour cher Interactor ! 🌟 Je suis votre **Assistant IA Interact officiel**.\n\nComment puis-je vous aider aujourd'hui ?\n- 💼 *Fiches de postes & responsabilités*\n- ✍️ *Rédaction d'une lettre de motivation pour le Bureau*\n- 🎯 *Plan d'action ou dossier de sponsoring*\n- 💡 *Idées d'actions sociales et caritatives*\n\nChoisissez une suggestion ci-dessus ou posez directement votre question !`,
        'ai'
      );
    }
  }

  sendQuickPrompt(promptText) {
    if (this.inputField) {
      this.inputField.value = promptText;
      this.handleSendMessage();
    }
  }

  async handleSendMessage() {
    if (!this.inputField) return;
    const prompt = this.inputField.value.trim();
    if (!prompt) return;

    // Add user message to UI
    this.addMessage(prompt, 'user');
    this.inputField.value = '';

    // Show typing indicator
    const typingElem = this.showTypingIndicator();

    try {
      const responseText = await this.callGeminiApi(prompt);
      this.removeTypingIndicator(typingElem);
      this.addMessage(responseText, 'ai');
    } catch (error) {
      this.removeTypingIndicator(typingElem);
      console.error("Gemini API error:", error);
      this.addMessage(
        `⚠️ Une difficulté est survenue lors de la communication avec l'IA Gemini. (${error.message || 'Erreur réseau'}). Vous pouvez vérifier votre clé API dans Paramètres ou utiliser les modèles pré-enregistrés.`,
        'ai'
      );
    }
  }

  async callGeminiApi(userPrompt) {
    // Format conversation history for Gemini API
    const contents = [];
    
    // Add context and system guidance in user/model turns
    contents.push({
      role: "user",
      parts: [{ text: `Instruction système : ${this.systemInstruction}\n\nQuestion de l'Interactor : ${userPrompt}` }]
    });

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${this.modelName}:generateContent?key=${this.apiKey}`;

    const requestBody = {
      contents: contents,
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1500
      }
    };

    let response;
    try {
      response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });
    } catch (netErr) {
      // Fallback endpoint if primary fails
      const fallbackEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`;
      response = await fetch(fallbackEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });
    }

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData?.error?.message || `Erreur HTTP ${response.status}`);
    }

    const data = await response.json();
    const candidate = data?.candidates?.[0];
    const text = candidate?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error("Réponse vide reçue de l'API.");
    }

    return text;
  }

  addMessage(text, sender = 'ai') {
    if (!this.messagesContainer) return;

    this.chatHistory.push({ text, sender });

    const bubble = document.createElement('div');
    bubble.className = `chat-bubble ${sender}`;

    if (sender === 'ai') {
      bubble.innerHTML = this.formatMarkdown(text);
      
      // Add copy button
      const copyBtn = document.createElement('button');
      copyBtn.className = 'btn-link';
      copyBtn.style.fontSize = '0.7rem';
      copyBtn.style.marginTop = '8px';
      copyBtn.style.display = 'block';
      copyBtn.innerHTML = '📋 Copier le contenu';
      copyBtn.onclick = () => {
        navigator.clipboard.writeText(text);
        window.app.showToast('Contenu copié dans le presse-papier !', 'success');
      };
      bubble.appendChild(copyBtn);
    } else {
      bubble.textContent = text;
    }

    this.messagesContainer.appendChild(bubble);
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
  }

  showTypingIndicator() {
    if (!this.messagesContainer) return null;
    const indicator = document.createElement('div');
    indicator.className = 'ai-typing-indicator';
    indicator.innerHTML = '<span></span><span></span><span></span>';
    this.messagesContainer.appendChild(indicator);
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    return indicator;
  }

  removeTypingIndicator(elem) {
    if (elem && elem.parentNode) {
      elem.parentNode.removeChild(elem);
    }
  }

  formatMarkdown(text) {
    if (!text) return '';
    let formatted = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Headers (### Header)
    formatted = formatted.replace(/^### (.*$)/gim, '<h4>$1</h4>');
    formatted = formatted.replace(/^## (.*$)/gim, '<h3>$1</h3>');
    formatted = formatted.replace(/^# (.*$)/gim, '<h2>$1</h2>');

    // Bold (**bold**)
    formatted = formatted.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');

    // Italic (*italic*)
    formatted = formatted.replace(/\*(.*?)\*/gim, '<em>$1</em>');

    // Code (`code`)
    formatted = formatted.replace(/`(.*?)`/gim, '<code>$1</code>');

    // Bullet lists (- or *)
    formatted = formatted.replace(/^\s*[-*]\s+(.*$)/gim, '<li>$1</li>');
    formatted = formatted.replace(/(<li>.*<\/li>)/gims, '<ul>$1</ul>');

    // Line breaks
    formatted = formatted.replace(/\n/gim, '<br>');

    return formatted;
  }
}

// Global AI assistant instance
const aiAssistant = new AIAssistantManager();
window.aiAssistant = aiAssistant;
