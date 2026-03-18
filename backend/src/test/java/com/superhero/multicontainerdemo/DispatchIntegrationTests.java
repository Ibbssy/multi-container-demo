package com.superhero.multicontainerdemo;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.superhero.multicontainerdemo.dispatch.CreateDispatchRequest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class DispatchIntegrationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void shouldCreateDispatchWithCoordinates() throws Exception {
        CreateDispatchRequest request = new CreateDispatchRequest("SHELLHEAD", 3, -37.810176, 144.962734);

        mockMvc.perform(post("/dispatches")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("CREATED"))
                .andExpect(jsonPath("$.heroCode").value("SHELLHEAD"))
                .andExpect(jsonPath("$.severity").value(3))
                .andExpect(jsonPath("$.latitude").value(-37.810176))
                .andExpect(jsonPath("$.longitude").value(144.962734));
    }
}
