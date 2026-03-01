package com.kawaii.doodle.worker;

import androidx.hilt.work.WorkerAssistedFactory;
import androidx.work.ListenableWorker;
import dagger.Binds;
import dagger.Module;
import dagger.hilt.InstallIn;
import dagger.hilt.codegen.OriginatingElement;
import dagger.hilt.components.SingletonComponent;
import dagger.multibindings.IntoMap;
import dagger.multibindings.StringKey;
import javax.annotation.processing.Generated;

@Generated("androidx.hilt.AndroidXHiltProcessor")
@Module
@InstallIn(SingletonComponent.class)
@OriginatingElement(
    topLevelClass = CriticalHealthWorker.class
)
public interface CriticalHealthWorker_HiltModule {
  @Binds
  @IntoMap
  @StringKey("com.kawaii.doodle.worker.CriticalHealthWorker")
  WorkerAssistedFactory<? extends ListenableWorker> bind(
      CriticalHealthWorker_AssistedFactory factory);
}
