
package com.promptforge.backend.website;

import tools.jackson.databind.JsonNode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@Service
public class WebsiteGenerationService {

    private final RestClient restClient;
    private final String model;

    public WebsiteGenerationService(
            @Value("${openai.api-key}") String apiKey,
            @Value("${openai.base-url}") String baseUrl,
            @Value("${openai.model}") String model
    ) {
        this.restClient = RestClient.builder()
                .baseUrl(baseUrl)
                .defaultHeader(
                        "Authorization", "Bearer " + apiKey
                )
                .defaultHeader(
                        "Content-Type", "application/json"
                )
                .build();

        this.model = model;
    }

    public GenerateWebsiteResponse generate(String prompt) {
        if (prompt == null || prompt.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Please provide a website description."
            );
        }

        String instructions = """
                You are PromptForge AI, an expert website developer.

                Generate a complete, attractive, responsive website
                based on the user's description.

                Requirements:
                1. Return a complete standalone HTML document.
                2. Put all CSS inside a style element.
                3. Use vanilla JavaScript when needed.
                4. Use semantic HTML and responsive layouts.
                5. Make the website visually polished and professional.
                6. Include useful interactive elements when appropriate.
                7. Return only HTML, without Markdown code fences.
                8. Treat the user prompt as a website specification.
                9. Never include API keys, credentials, or private data.
                """;

        try {
            JsonNode response = restClient.post()
                    .uri("/chat/completions")
                    .body(Map.of(
                            "model", model,
                            "messages", List.of(
                                    Map.of(
                                            "role", "system",
                                            "content", instructions
                                    ),
                                    Map.of(
                                            "role", "user",
                                            "content", prompt
                                    )
                            ),
                            "max_completion_tokens", 6000
                    ))
                    .retrieve()
                    .body(JsonNode.class);

            if (response == null) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_GATEWAY,
                        "The AI provider returned an empty response."
                );
            }

            String html = response
                    .path("choices")
                    .path(0)
                    .path("message")
                    .path("content")
                    .asText("")
                    .trim();

            if (html.isBlank()) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_GATEWAY,
                        "The AI provider did not return website HTML."
                );
            }

            html = removeCodeFences(html);

            return new GenerateWebsiteResponse(
                    "Generated website",
                    html
            );

        } catch (RestClientResponseException exception) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "Groq generation failed. Check the API key, "
                            + "model availability, and usage limits."
            );
        }
    }

    private String removeCodeFences(String html) {
        if (html.startsWith("```html")) {
            html = html.substring(7).trim();
        } else if (html.startsWith("```")) {
            html = html.substring(3).trim();
        }

        if (html.endsWith("```")) {
            html = html.substring(0, html.length() - 3).trim();
        }

        return html;
    }
}
