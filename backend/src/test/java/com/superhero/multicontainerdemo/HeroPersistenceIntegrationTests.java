package com.superhero.multicontainerdemo;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.superhero.multicontainerdemo.hero.CreateHeroRequest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class HeroPersistenceIntegrationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void shouldLookupSeededHeroFromDatabase() throws Exception {
        mockMvc.perform(get("/superhero").param("username", "tony"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.superHeroName").value("IronMan"))
                .andExpect(jsonPath("$.heroCode").value("SHELLHEAD"));
    }

    @Test
    void shouldCreateAndReadBackHero() throws Exception {
        CreateHeroRequest request = new CreateHeroRequest("natasha", "Black Widow", "WIDOW");

        mockMvc.perform(post("/heroes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.username").value("natasha"))
                .andExpect(jsonPath("$.superHeroName").value("Black Widow"))
                .andExpect(jsonPath("$.heroCode").value("WIDOW"));

        mockMvc.perform(get("/superhero").param("username", "natasha"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.superHeroName").value("Black Widow"))
                .andExpect(jsonPath("$.heroCode").value("WIDOW"));
    }
}
