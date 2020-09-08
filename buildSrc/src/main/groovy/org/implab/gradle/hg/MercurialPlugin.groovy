package org.implab.gradle.hg;

import org.gradle.api.Plugin;
import org.gradle.api.Project;

public class MercurialPlugin implements Plugin<Project> {
    public void apply(Project project) {
        if (!project.version) {
    
            def rev = ["hg", "log", "-r", ".", "--template", "{latesttag('re:^v') % '{tag}-{distance}'}"].execute().text.trim();

            def tagVersion;
            def tagDistance;

            def match = (rev =~ /^v(\d+\.\d+\.\d+(?:-\w+)?).*-(\d+)$/);
            
            if (match.size()) {
                tagVersion = match[0][1];
                tagDistance = match[0][2].toInteger();
            } else {
                throw new Exception("A version must be specied");
            }

            project.version = tagVersion;

            if (tagDistance > 0)
                project.version++;
        } else {
            println "explicit version: $project.version";
        }
    }
}