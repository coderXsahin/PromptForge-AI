
package com.promptforge.backend.project;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface WebsiteProjectRepository
        extends JpaRepository<WebsiteProject, Long> {
}
