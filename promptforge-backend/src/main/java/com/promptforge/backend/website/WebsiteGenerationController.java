
package com.promptforge.backend.website;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/websites")
@CrossOrigin(origins = "http://localhost:5173")
public class WebsiteGenerationController {

    private final WebsiteGenerationService generationService;

    public WebsiteGenerationController(
            WebsiteGenerationService generationService
    ) {
        this.generationService = generationService;
    }

    @PostMapping("/generate")
    public GenerateWebsiteResponse generate(
            @Valid @RequestBody GenerateWebsiteRequest request
    ) {
        return generationService.generate(request.prompt());
    }
}
