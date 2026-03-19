package com.superhero.multicontainerdemo;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.superhero.multicontainerdemo.dispatch.CreateDispatchRequest;
import io.micrometer.core.instrument.MeterRegistry;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class DispatchIntegrationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private MeterRegistry meterRegistry;

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

    @Test
    void shouldRejectDispatchWithInvalidCoordinates() throws Exception {
        CreateDispatchRequest request = new CreateDispatchRequest("SHELLHEAD", 3, -120.0, 144.962734);

        mockMvc.perform(post("/dispatches")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void shouldIncrementDispatchMetricsAfterCreatingDispatch() throws Exception {
        CreateDispatchRequest request = new CreateDispatchRequest("SHELLHEAD", 2, -37.810176, 144.962734);
        double countBefore = meterRegistry.get("dispatches_created_total").counter().count();

        mockMvc.perform(post("/dispatches")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        double countAfter = meterRegistry.get("dispatches_created_total").counter().count();
        assertThat(countAfter).isGreaterThan(countBefore);
    }
}
