package com.example.plugins.tutorial;

import com.atlassian.plugin.Plugin;
import com.atlassian.plugin.PluginAccessor;
import com.atlassian.plugin.PluginInformation;
import com.atlassian.plugin.PluginParseException;
import com.atlassian.plugin.spring.scanner.annotation.component.Scanned;
import com.atlassian.plugin.spring.scanner.annotation.imports.ComponentImport;
import com.atlassian.plugin.web.ContextProvider;
import com.google.common.collect.Maps;

import java.util.Map;

@Scanned
public class DashboardItemContextProvider implements ContextProvider {
    private final PluginAccessor pluginAccessor;

    public DashboardItemContextProvider(
            @ComponentImport PluginAccessor pluginAccessor) {
        this.pluginAccessor = pluginAccessor;
    }

    @Override
    public void init(final Map<String, String> params) throws PluginParseException {
    }

    @Override
    public Map<String, Object> getContextMap(final Map<String, Object> context) {
        final Map<String, Object> newContext = Maps.newHashMap(context);
        Plugin plugin = pluginAccessor.getEnabledPlugin("com.example.plugins.tutorial.dashboard-item-tutorial");
        newContext.put("version", plugin.getPluginInformation().getVersion());
        newContext.put("pluginName", "my_pluginName");
        //my test data
        newContext.put("message", "message - 47");
        //
        return newContext;
    }
}